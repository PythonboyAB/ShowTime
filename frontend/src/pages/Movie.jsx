import React from 'react'
import Navbar from '../components/Navbar'
import MoviesPage from '../components/MoviesPage'
import Footer from '../components/Footer'


const Movie = () => {
  return (
    <div>
      <Navbar />
      <MoviesPage/>
      <Footer/>
      
    </div>
  )
}

export default Movie