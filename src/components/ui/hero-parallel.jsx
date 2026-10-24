"use client"
import React from "react"
import { motion, useScroll, useTransform, useSpring } from "framer-motion"

export const HeroParallax = ({ products }) => {
  const firstRow = products.slice(0, 5)
  const secondRow = products.slice(5, 10)
  const thirdRow = products.slice(10, 15)
  const ref = React.useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  })

  const springConfig = { stiffness: 300, damping: 30, bounce: 100 }

  // Synchronized scroll-based translations
  const translateXRight = useSpring(useTransform(scrollYProgress, [0, 1], [0, 1200]), springConfig)
  const translateXLeft = useSpring(useTransform(scrollYProgress, [0, 1], [0, -1200]), springConfig)

  const rotateX = useSpring(useTransform(scrollYProgress, [0, 0.2], [15, 0]), springConfig)
  const opacity = useSpring(useTransform(scrollYProgress, [0, 0.2], [0.2, 1]), springConfig)
  const rotateZ = useSpring(useTransform(scrollYProgress, [0, 0.2], [20, 0]), springConfig)
  const translateY = useSpring(useTransform(scrollYProgress, [0, 0.2], [-500, 200]), springConfig)

  return (
    <div
      ref={ref}
      className="relative h-[250vh] md:h-[300vh] py-20 md:py-40 overflow-hidden antialiased flex flex-col self-auto [perspective:1000px] [transform-style:preserve-3d] bg-black"
    >
      {/* Header Section */}
      <Header />

      {/* Parallax Cards Container */}
      <motion.div
        style={{
          rotateX,
          rotateZ,
          translateY,
          opacity,
        }}
        className="relative z-10"
      >
        {/* First Row - Moves RIGHT on scroll down */}
        <div className="relative overflow-hidden mb-10 md:mb-20">
          <motion.div
            className="flex flex-row-reverse space-x-reverse space-x-8 md:space-x-20"
            style={{ x: translateXRight }}
          >
            {[...firstRow, ...firstRow].map((product, index) => (
              <ProductCard product={product} translate={translateXRight} key={`first-${index}`} />
            ))}
          </motion.div>
        </div>

        {/* Second Row - Moves LEFT on scroll down */}
        <div className="relative overflow-hidden mb-10 md:mb-20">
          <motion.div className="flex flex-row space-x-8 md:space-x-20" style={{ x: translateXLeft }}>
            {[...secondRow, ...secondRow].map((product, index) => (
              <ProductCard product={product} translate={translateXLeft} key={`second-${index}`} />
            ))}
          </motion.div>
        </div>

        {/* Third Row - Moves RIGHT on scroll down */}
        <div className="relative overflow-hidden">
          <motion.div
            className="flex flex-row-reverse space-x-reverse space-x-8 md:space-x-20"
            style={{ x: translateXRight }}
          >
            {[...thirdRow, ...thirdRow].map((product, index) => (
              <ProductCard product={product} translate={translateXRight} key={`third-${index}`} />
            ))}
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

export const ProductCard = ({ product, translate }) => {
  return (
    <motion.div
      whileHover={{
        y: -20,
        scale: 1.05,
      }}
      key={product.title}
      className="group/product h-64 w-80 md:h-96 md:w-[30rem] relative shrink-0"
    >
      <a href={product.link} className="block group-hover/product:shadow-2xl">
        <img
          src={product.thumbnail || "/placeholder.svg"}
          height="600"
          width="600"
          className="object-cover object-left-top absolute h-full w-full inset-0 rounded-lg"
          alt={product.title}
        />
      </a>
      <div className="absolute inset-0 h-full w-full opacity-0 group-hover/product:opacity-80 bg-gradient-to-t from-black via-purple-900/20 to-transparent pointer-events-none rounded-lg transition-opacity duration-300"></div>
      <h2 className="absolute bottom-2 left-2 md:bottom-4 md:left-4 opacity-0 group-hover/product:opacity-100 text-white font-semibold text-sm md:text-base transition-opacity duration-300">
        {product.title}
      </h2>
    </motion.div>
  )
}

export const Header = () => {
  return (
    <div className="max-w-7xl relative mx-auto py-10 md:py-20 lg:py-40 px-4 w-full left-0 top-0 z-20">
      <h1 className="text-xl md:text-4xl lg:text-7xl font-bold text-white">
        Our Portfolio <br /> & Success Stories
      </h1>
      <p className="max-w-2xl text-sm md:text-base lg:text-xl mt-4 md:mt-8 text-neutral-200">
        Discover how we've transformed businesses across industries with cutting-edge AI automation solutions. Each
        project represents innovation, efficiency, and measurable results.
      </p>
    </div>
  )
}
