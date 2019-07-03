"use strict"
Object.defineProperty(String.prototype, 'format', {
	value: function(...param) {
		let i = 0, // Indice para ajudar a percorrer valores
			e = this, // Entrada
			removeStr = [], // Array de ajuda para remover valores já usados
			expceptions = ['{}','{:}','{:^}','{:<}','{:>}'],
			srtSpc = e.match(/({.*?})/g), // Separação de cada mascara
			elemForm = (mask, el) =>{
				return !mask.includes('{')? mask : 
							mask.split(/([{}])/g)
								.filter(f=>!['{','}'].includes(f))
								.map(it_mk=>{
									let params = +it_mk.slice(1) && !it_mk.includes('.')? +it_mk.slice(1) : 
										/:(\D)+?(\D)*?(\d+)/g.exec(it_mk) || it_mk,
										valSet = (typeof el=="string"? el : el[i]);
					
					if(typeof params=="string") return it_mk;
					else{
						if(typeof params=="number") return " ".repeat(params).replace(RegExp(`.{${el[i].length}}`), el[i]);
						else{
							let p1 = params[1],
								fill_elem = ([...'<^>.'].includes(p1)? ' ':p1),
								sz_sp = (+params[3])-valSet.length,
								space = !p1.includes('.')? 
											fill_elem.repeat(sz_sp<0? valSet.length:sz_sp) : '',
								elem = [space, valSet],
								srt_crop = valSet.slice(0,+params[3]),
								space_c = fill_elem.repeat(+params[3]),
								num = Math.floor((space_c.length-valSet.length)/2),
								str_pos = num>0? 
											fill_elem.repeat(num)+valSet: '',
								elem_center = space_c.replace(RegExp(`.{${sz_sp<0? valSet.length : str_pos.length}}`), str_pos);
								
							i++;
							return (params.includes('>')? elem : 
									params.includes('<')? elem.reverse() : 
									params.includes('^')? [sz_sp<0?valSet:elem_center] :  
									params.includes('.')? [srt_crop] : '').join('');
						}
					}
							
				}).join('');
			},
			elemLetter = (lett, pE, nth) =>{
				let lett_last = lett[lett.length-1],
					pad = {
						for: {d: 10, x: 16, X: 16, o: 8, b: 2},
						mask: {d: '', x: '0x', X: '0X', o: '0o', b: '0b', '':''}
					},
					nth_pers = nth.replace(/[eEfFgGdxXob#%]/g,''),
					val;

				if(lett_last){ // Verificar se tem Letra
					if(!+str[pE] && !['G','g'].includes(nth)){
						throw new Error(`Traceback (most recent call last):
							"${nth}".format(${param.map(e=>typeof e=="string"? `"${e}"` : e).join(', ')})
	ValueError: Unknown format code '${lett_last}' for object of type 'str'`);
					}else if(lett_last.toLowerCase().includes('f')){
						let exp = +str[pE]>0? 
								nth.includes(' ')? ' ' : 
								nth.includes('+')? '+' : '' : '';

						val = exp+(parseFloat(str[pE]).toFixed(6));
						val = !lett[4]? val : // Validar se precisa de pós-tratamento
								elemForm(nth_pers, val);

					} else if([...'dxXob'].includes(lett_last)){
						let op = (+str[pE])>0? // Numero é positivo
									nth.includes(' ')? ' ' : // Marcador é espaço e numero é positivo
									nth.includes('+')? '+' : // Marcador é positivo e numero é positivo
									nth.includes('-')? '+' : // Marcador é negativo e numero é positivo
									nth.includes('') ? '' : // Marcador Não existe
									'-' : // Marcador é negativo e numero também
								'-'; // Numero negativo

						val = op+(nth.includes('#')? pad.mask[lett_last] : '')+
								(+str[pE]).toString(pad.for[lett_last]).replace('-',''); // d na ultima posição procura a formula e mostra seu resultado
					
						val = nth.includes('X')? val.toUpperCase() : val; // Caixa Alta (FONTE)
						val = nth.replace(/[0-9a-z#+ -]/gi,'').length<4 || !lett[4]? val : 
								elemForm(nth_pers, val);
					} else if(['e','E'].includes(lett_last)){
						val = (+str[pE]).toExponential();
						val = nth.includes('E')? val.toUpperCase() : val;
						val = !lett[4]? val : elemForm(nth_pers, val);
					} else if(['g','G'].includes(lett_last)){
						val = lett_last == 'G'? str[pE].toUpperCase() : str[pE];
						val = !lett[4]? val : elemForm(nth_pers, val);
					}

					e = e.replace(nth, val); // Change for value
					removeStr.push(pE);
				}
			};

		let str = param.map(el=>el+''); // toString

		let paramStr = srtSpc.map(p=>{
			let isNum = +p.replace(/[{}]/g,'');
			return (p.match(/{(\D+.*?)/g)? [true] : [isNum<str.length])[0];
		}).filter(e=>!e); 

		let refParam = srtSpc.map(p=>{
			let isNum = +p.replace(/[{}]/g,'');
			return p.match(/{(\D+.*?)/g)? isNum : true;
		}).filter(p=>p);

		if(paramStr.length)
			return "Fail ref"; // Fail line
		else if(srtSpc.length-refParam.length>str.length || 
				srtSpc.length-refParam.length>=str.length && refParam.length)
			return "Overflow of parameters greater than amount of values"; // Fail line
		else{
			srtSpc.map((nth,pE)=>{
				let lett = /{(\d+)?:?([+_-])?(\W|_)?(\d+)?([eEfFdxXobcGg])?}/.exec(nth),
					expt = /{.*?([a-zA-Z])?}/.exec(nth);
					
				if(nth.includes('%')){
					let val = (+str[pE]*100).toFixed(6)+'%';
					e = e.replace(nth, val); // Change for value
				} else if(lett && [',','_'].includes(lett[3]) && +str[pE]){ // Separador deve existir e valor de atributo de ser numerico
					let div = str[pE].split(/(?=(?:...)*$)/).join(lett[3]);
					e = e.replace(nth, div); // Change for value
					removeStr.push(pE);
				} else if(lett && lett[1] && lett[1].length+2==nth.length){ // Saber se existe um numero antes do dois pontos {Numero:}
					e = e.replace(nth, str[lett[1]]); // Change for value
				} else if(lett && (+lett[4])<=str[pE].length && !lett.includes('.')){ // Mascara menor do que o valor
					e = e.replace(nth, str[pE]); // Change for value
					removeStr.push(pE);
				} else if(lett && !lett[4] && !lett[5] || lett && lett[1]){ // Change default
					if(expceptions.includes(nth)){
						e = e.replace(nth, str[pE]); // Change for value
						removeStr.push(pE);
					} else if(str.length-1>pE && !nth.includes('.')){ // Overflow string lenght
						if(str[pE].length >= +( lett[1] || ['0'])[0]){ 
							e = e.replace(nth, str[pE]); // Change for value
							removeStr.push(pE);
						}
					}
				} else if(lett){
					elemLetter(lett, pE, nth);
				} else if(expt && expt[1] && !['eEfFdxXobcGg'].includes(expt)){
					throw new Error(`Traceback (most recent call last):
	"${nth}".format(${param.map(e=>typeof e=="string"? `"${e}"` : e).join(', ')})
ValueError: Unknown format code '${expt[1]}' for object of type '${typeof (+str[pE] || str[pE])}'`);
				}
			});
		}

		removeStr.reverse().map(pE=>str.splice(pE,1));

		return elemForm(e, str);
	}
});