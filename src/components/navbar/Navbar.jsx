import { motion } from 'framer-motion'
import './navbar.scss'
import Sidebar from '../sidebar/Sidebar'

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
                    Vuong Chi Minh
                </motion.span>
                <div className='social'>
                    <a href="https://www.facebook.com/profile.php?id=100084054154164"><img src="public/facebook.png" alt="" /></a>
                    <a href="https://www.instagram.com/vuongchi330/"><img src="public/instagram.png" alt="" /></a>
                    <a href="https://www.tiktok.com/@minh.vng45"><img src="public/tiktok.png" /></a>
                </div>
            </div>
        </div>
    )
}

export default Navbar
