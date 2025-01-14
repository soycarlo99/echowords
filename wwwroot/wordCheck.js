// $('#gameInput').on('keydown', saveWord) // onsubmit for the saveWord form

// async function saveWord(e) {
//   e.preventDefault(); // not reload page on form submit
//   const newWord = $('[type="name"]').val();
//   console.log('newWord', newWord);
//   const response = await fetch('/new-word/', { // post (save new)
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ word: newWord })
//   });
//   console.log('response', response);
//   const data = await response.json();
//   console.log('data', data);
//   $('#message').text(newWord + ' lades till i databasen')
// }