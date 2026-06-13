import React, { useEffect } from 'react'
import Layout from './Layout'
import {motion} from 'framer-motion'
import {AnimatePresence} from 'framer-motion'
import useLayoutStore from '../store/layoutStore'
import { useState } from 'react'
import { getAllUsers } from '../services/user.service'
import ChatList from '../pages/chats/ChatList'

const Home = () => {
      // const setSelectedContact = useLayoutStore(
      // (state) => state.setSelectedContact)
      const [allUsers, setAllUsers]= useState([])
      const getUser = async () => {
        try{
          const result= await getAllUsers()
          if(result.status?.toLowerCase() === 'success') setAllUsers(result.data)
        }catch(error){
          console.log(error)
        }
      }

      useEffect(()=>{
        getUser()
      },[])
      console.log(allUsers)

  return (
    <>
      <motion.div
      className="h-full"
      >
        <ChatList
        contacts={allUsers}
        // setSelectedContact={setSelectedContact}
        />
        
        

      </motion.div>
    </>
    
  )
}

export default Home