import { useEffect, useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import './App.css'
import axios from 'axios';

function App() {
  const [jokes, setJokes] = useState([])
  useEffect(() => {
     axios.get('/api/jokes')
    //axios.get('http://localhost:3000/api/jokes') // this is the same as axios.get('/api/jokes')
    .then((response) => {
      
      setJokes(response.data)
    })
    .catch((error) => {
      console.log(error)
    })

    //the code above is the same as the code below

    // fetch('/api/jokes')
    // .then((response) => response.json())
    // .then((data) => {
    //   setJokes(data)
    // })
  }, )

  return (
    <>
      <h1>UT Full Stack Code</h1>
      <p>JOKES: {jokes.length}</p>

      {
        jokes.map((joke, index) =>(
          <div key={joke.id}>
            <h3>{joke.title}</h3>
            <p>{joke.content}</p>

          </div>
        ))
      }
    </>
  )
}

export default App
