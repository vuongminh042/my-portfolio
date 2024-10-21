import { motion, useScroll, useSpring, useTransform } from 'framer-motion'
import './portfolio.scss'
import { useRef } from 'react'

const items = [
    {
        id: 1,
        title: "Furniture Website Interface",
        img: "https://res.cloudinary.com/davbn16ri/image/upload/v1729501963/mkhaufaxq5viojov5ti1.png",
        desc: "Explore the world of furniture with our website interface! Featuring a modern design, easy navigation, and sharp product images, we bring you an exceptional shopping experience. Find the perfect furniture pieces for your living space with just a few clicks. Don't miss the chance to refresh your home with high-quality products and dedicated customer service!",
        demoLink: "https://timely-sawine-9814c9.netlify.app/"
    },
    {
        id: 2,
        title: "Website Selling Fresh Fruits and Vegetables",
        img: "https://res.cloudinary.com/davbn16ri/image/upload/v1729501963/dtqgcuwrv6cwkbecsnqa.png",
        desc: "An e-commerce platform offering a wide variety of fresh fruits and vegetables. The website features a user-friendly interface for browsing products, placing orders, and tracking deliveries. It also includes an integrated payment system and options for both local and organic produce.",
        demoLink: "https://heartfelt-boba-a8c638.netlify.app/"
    },
    {
        id: 3,
        title: "Website Selling Electronic Headphones",
        img: "https://res.cloudinary.com/davbn16ri/image/upload/v1729501964/jcacr0bpgwcifpmgryou.png",
        desc: "An online store specializing in high-quality electronic headphones. The site offers detailed product descriptions, customer reviews, and various models from leading brands. With advanced filtering options, customers can easily find headphones that match their preferences, including wireless and noise-canceling features.",
        demoLink: "https://sweet-daifuku-202f76.netlify.app/"
    },
    {
        id: 4,
        title: "Website Selling Electronic Headphones",
        img: "https://res.cloudinary.com/davbn16ri/image/upload/v1729503218/x1xmeoobwwtrrlmbteml.png",
        desc: "My Portfolio",
        demoLink: "https://deft-froyo-3083c1.netlify.app/"
    }
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
