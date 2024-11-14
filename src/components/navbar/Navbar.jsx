import { motion } from 'framer-motion'
import './navbar.scss'
import Sidebar from '../sidebar/Sidebar'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react'

const Navbar = () => {
    return (
        <div className='navbar'>
            {/* Sidebar */}
            <Sidebar />
            <div className='wrapper'>
                <motion.span
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}>

                </motion.span>
                <div className='social'>

                    <a href="https://www.facebook.com/profile.php?id=100084054154164"><img src="https://res.cloudinary.com/davbn16ri/image/upload/v1729504014/portfolio/mm9dp4lpryetpuybp9h3.png" alt="" /></a>
                    <a href="https://www.instagram.com/vuongchi330/"><img src="https://res.cloudinary.com/davbn16ri/image/upload/v1729504013/portfolio/o68yilmpgwewz8jklog0.png" alt="" /></a>
                    <a href="https://www.tiktok.com/@minh.vng45"><img src="https://res.cloudinary.com/davbn16ri/image/upload/v1729504015/portfolio/ta9v5sroqyrazxeswvsp.png" /></a>
                    <div>
                        <SignedOut>
                            <SignInButton />
                        </SignedOut>
                        <SignedIn>
                            <UserButton />
                        </SignedIn>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Navbar
