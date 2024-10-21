import { motion } from 'framer-motion'
import { useRef } from 'react'
import './services.scss'

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
                    <img src="https://res.cloudinary.com/davbn16ri/image/upload/v1729504015/portfolio/mfelzsfommxxcstpvoef.webp" alt="People" />
                    <h1>
                        <motion.b whileHover={{ color: 'orange' }}>Specialized</motion.b> Frontend Libraries
                    </h1>
                </div>
                <div className='title'>
                    <h1>
                        <motion.b whileHover={{ color: 'orange' }}>For Your</motion.b> Projects
                    </h1>
                    <motion.button whileHover={{ scale: 1.1 }}>EXPLORE OUR LIBRARIES</motion.button>
                </div>
            </motion.div>

            {/* List Container */}
            <motion.div className='listContainer' variants={variants}>
                <motion.div className='box' whileHover={{ color: 'black', background: 'lightgray' }}>
                    <h2>React JS</h2>
                    <p>React JS is a popular JavaScript library for building user interfaces. Its known for its component-based architecture and the virtual DOM, which makes web applications faster and more efficient.</p>
                    <motion.button whileHover={{ scale: 1.05 }}><a href="https://react.dev/">View Here</a> </motion.button>
                </motion.div>

                <motion.div className='box' whileHover={{ color: 'black', background: 'lightgray' }}>
                    <h2>Angular</h2>
                    <p>Angular is a robust front-end framework developed by Google, used for creating dynamic web applications. It offers two-way data binding and dependency injection, making development more streamlined.</p>
                    <motion.button whileHover={{ scale: 1.05 }}><a href="https://angular.dev/">View Here</a></motion.button>
                </motion.div>

                <motion.div className='box' whileHover={{ color: 'black', background: 'lightgray' }}>
                    <h2>Vue JS</h2>
                    <p>Vue JS is a flexible and easy-to-learn JavaScript framework. Its designed to be adaptable and allows developers to progressively integrate its features into their projects.</p>
                    <motion.button whileHover={{ scale: 1.05 }}><a href="https://vuejs.org/">View Here</a></motion.button>
                </motion.div>

                <motion.div className='box' whileHover={{ color: 'black', background: 'lightgray' }}>
                    <h2>HTML & CSS & JAVASCRIPT</h2>
                    <p>HTML, CSS, and JavaScript are the foundational technologies for building web pages. HTML structures the content, CSS styles it, and JavaScript adds interactivity and dynamic behavior, allowing for a rich and engaging user experience.</p>
                    <motion.button whileHover={{ scale: 1.05 }}><a href="https://www.w3schools.com/">View Here</a></motion.button>
                </motion.div>

            </motion.div>
        </motion.div>
    )
}

export default Services
