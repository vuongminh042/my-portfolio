import { useRef } from 'react'
import './services.scss'
import { motion, useInView } from 'framer-motion'

const variants = {
    initial: {
        x: -500,
        y: 100,
        opacity: 0
    },
    animate: {
        x: 0,
        opacity: 1,
        y: 0,
        transition: {
            duration: 1,
            staggerChildren: 0.1
        }
    }
}

const Services = () => {
    const ref = useRef()

    const isInView = useInView(ref, { margin: '-100px' })

    return (
        <motion.div
            className='services'
            variants={variants}
            initial="initial"
            // animate="animate"
            // whileInView="animate"
            ref={ref}
            animate={"animate"}
        >
            {/* Text Container */}
            <motion.div className='textContainer' variants={variants}>
                <p>I focus on helping your brand grow
                    <br />and move forward</p>
                <hr />
            </motion.div>

            {/* Title Container */}
            <motion.div className='titleContainer' variants={variants}>
                <div className='title'>
                    <img src="public/people.webp" alt="People" />
                    <h1>
                        <motion.b whileHover={{ color: 'orange' }}>Unique</motion.b> Ideas
                    </h1>
                </div>
                <div className='title'>
                    <h1>
                        <motion.b whileHover={{ color: 'orange' }}>For Your</motion.b> Business
                    </h1>
                    <motion.button whileHover={{ scale: 1.1 }}>WHAT WE DO?</motion.button>
                </div>
            </motion.div>

            {/* List Container */}
            <motion.div className='listContainer' variants={variants}>
                <motion.div className='box' whileHover={{ color: 'black', background: 'lightgray' }}>
                    <h2>Branding</h2>
                    <p>NODE JS</p>
                    <motion.button whileHover={{ scale: 1.05 }}>Go</motion.button>
                </motion.div>
                <motion.div className='box' whileHover={{ color: 'black', background: 'lightgray' }}>
                    <h2>Branding</h2>
                    <p>REACT</p>
                    <motion.button whileHover={{ scale: 1.05 }}>Go</motion.button>
                </motion.div>
                <motion.div className='box' whileHover={{ color: 'black', background: 'lightgray' }}>
                    <h2>Branding</h2>
                    <p>ANGULAR</p>
                    <motion.button whileHover={{ scale: 1.05 }}>Go</motion.button>
                </motion.div>
                <motion.div className='box' whileHover={{ color: 'black', background: 'lightgray' }}>
                    <h2>Branding</h2>
                    <p>HTML & CSS</p>
                    <motion.button whileHover={{ scale: 1.05 }}>Go</motion.button>
                </motion.div>
            </motion.div>
        </motion.div>
    )
}

export default Services
