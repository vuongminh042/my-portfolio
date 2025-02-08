import { motion, useScroll, useSpring, useTransform } from 'framer-motion'
import './portfolio.scss'
import { useRef } from 'react'

const items = [
    {
        id: 1,
        title: "Chatapp Real Time",
        img: "https://res.cloudinary.com/davbn16ri/image/upload/v1738982064/portfolio/xi7syqiy4isjmlawxejv.png",
        desc: "A real-time chat application with a sleek and user-friendly interface. Features include instant messaging, media sharing, typing indicators, and online/offline status updates. Designed for seamless communication, this app ensures a smooth chatting experience with real-time synchronization.",
        demoLink: "https://message-chatapp.onrender.com/"
    },
    {
        id: 2,
        title: "Server Meme",
        img: "https://res.cloudinary.com/davbn16ri/image/upload/v1738982226/portfolio/f4nexv8k1htu2tqfhumm.png",
        desc: "A meme-sharing platform where users can upload, browse, and engage with a variety of memes. The website includes user authentication, meme categorization, and interactive features such as likes and comments. A fun and engaging space for meme lovers to connect and share humor.",
        demoLink: "https://server-meme.netlify.app/logout"
    },
]

const Single = ({ item }) => {
    const ref = useRef()
    const { scrollYProgress } = useScroll({
        target: ref,
    })

    const y = useTransform(scrollYProgress, [0, 1], [-300, 300])

    return (
        <section>
            <div className='container'>
                <div className='wrapper'>
                    <div className='imageContainer' ref={ref}>
                        <img src={item.img} alt={item.title} />
                    </div>
                    <motion.div className='textContainer' style={{ y }}>
                        <h2>{item.title}</h2>
                        <p>{item.desc}</p>
                        <a href={item.demoLink} target="_blank" rel="noopener noreferrer">
                            <button>See Demo</button>
                        </a>
                    </motion.div>
                </div>
            </div>
        </section>
    )
}

const Portfolio = () => {
    const ref = useRef()

    const { scrollYProgress } = useScroll({ target: ref, offset: ["end end", "start start"] })
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
    })

    return (
        <div className='portfolio' ref={ref}>
            <div className='progress'>
                <h1>Featured Works</h1>
                <motion.div style={{ scaleX }} className='progressBar'></motion.div>
            </div>
            {items.map((item) => (
                <Single item={item} key={item.id} />
            ))}
        </div>
    )
}

export default Portfolio
