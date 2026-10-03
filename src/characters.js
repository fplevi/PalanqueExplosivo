export const CHARACTERS = [
  { id: 'lula', name: 'Lula', fullName: 'Luiz Inácio Lula da Silva', party: 'PT', color: '#ed5c57', suit: '#273956', skin: '#e6b88d', hair: '#d9dfd7', beard: '#edf0df', style: 'short' },
  { id: 'clariana', name: 'Clariana Barão', fullName: 'Clariana Barão', party: 'DC', color: '#71b7df', suit: '#328ab1', skin: '#dcab85', hair: '#c9b477', style: 'long' },
  { id: 'edmilson', name: 'Edmilson Costa', fullName: 'Edmilson Costa', party: 'PCB', color: '#dd7b55', suit: '#d92336', outfit: 'tshirt', skin: '#d4a782', hair: '#ced1c4', beard: '#e0e0d8', glasses: true, style: 'short' },
  { id: 'cury', name: 'Augusto Cury', fullName: 'Augusto Cury', party: 'Avante', color: '#f0a74f', suit: '#3e5062', skin: '#e0b188', hair: '#858171', glasses: true, glassesColor: '#a6a59b', style: 'short' },
  { id: 'flavio', name: 'Flávio Bolsonaro', fullName: 'Flávio Bolsonaro', party: 'PL', color: '#67a0d4', suit: '#1e3d68', skin: '#e9bf9c', hair: '#46352b', style: 'side' },
  { id: 'hertz', name: 'Hertz Dias', fullName: 'Hertz Dias', party: 'PSTU', color: '#db6a78', suit: '#973c40', skin: '#996443', hair: '#262725', style: 'short' },
  { id: 'renan', name: 'Renan Santos', fullName: 'Renan Santos', party: 'Missão', color: '#aa8bcd', suit: '#313b45', skin: '#d7a27b', hair: '#352c25', beard: '#47372c', beardStyle: 'stubble', style: 'side' },
  { id: 'caiado', name: 'Ronaldo Caiado', fullName: 'Ronaldo Caiado', party: 'PSD', color: '#74ac82', suit: '#466757', skin: '#deb089', hair: '#e6e4d4', style: 'side' },
  { id: 'rui', name: 'Rui Costa Pimenta', fullName: 'Rui Costa Pimenta', party: 'PCO', color: '#db776b', suit: '#7e554b', skin: '#deb086', hair: '#403b36', beard: '#77746c', beardStyle: 'stubble', glasses: true, style: 'short' },
  { id: 'samara', name: 'Samara Martins', fullName: 'Samara Martins', party: 'UP', color: '#b096d4', suit: '#695289', skin: '#a36f4f', hair: '#342b29', glasses: true, style: 'long' },
  { id: 'wilson', name: 'Wilson Grassi', fullName: 'Wilson Grassi', party: 'Democrata', color: '#79b9b2', suit: '#386f71', skin: '#d9ad86', hair: '#645d51', style: 'side' },
  { id: 'zema', name: 'Romeu Zema', fullName: 'Romeu Zema', party: 'Novo', color: '#e6a363', suit: '#4e6070', skin: '#e2b68f', hair: '#77786e', style: 'short' },
];

export function characterFor(id) {
  return CHARACTERS.find(character => character.id === id) ?? CHARACTERS[0];
}
