import { motion } from 'framer-motion'
import './navbar.scss'

const Navbar = () => {
    return (
        <div className='navbar'>
            {/* Sidebar */}
            <div className='wrapper'>
                <motion.span
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}>
                    Vuong Chi Minh
                </motion.span>
                <div className='social'>
                    <a href="#"><img src="public/facebook.png" alt="" /></a>
                    <a href="#"><img src="public/instagram.png" alt="" /></a>
                    <a href="#"><img src="public/tiktok.png" /></a>
                    <a href="#"><img src="public/github.png" /></a>
                </div>
            </div>
        </div>
    )
}

export default Navbar
