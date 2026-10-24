"use client"
import { HeroParallax } from "./ui/hero-parallel"
import leadToOrder from "./images/leadtoorder.png"
import CheckList from "./images/checklist.png"
import Storeapp from "./images/storeapp.png"
import Otp from "./images/otp.png"
import Purchase from "./images/purchase.png"
import Salon from "./images/salon.png"
import Complaint from "./images/complaint.png"
import Billet from "./images/billet.png"

const products = [
  {
    title: "AI Automation Platform",
    link: "#",
    thumbnail: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&h=600&fit=crop",
  },
  {
    title: "Lead To Order",
    link: "#",
    thumbnail: leadToOrder,
  },
  {
    title: "Checklist And Delegation",
    link: "#",
    thumbnail: CheckList,
  },
  {
    title: "Data Analytics",
    link: "#",
    thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=600&fit=crop",
  },
  {
    title: "Machine Learning",
    link: "#",
    thumbnail: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=600&h=600&fit=crop",
  },
  {
    title: "Digital Transformation",
    link: "#",
    thumbnail: "https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=600&h=600&fit=crop",
  },
  {
    title: "OTP",
    link: "#",
    thumbnail: Otp,
  },
  {
    title: "Store App",
    link: "#",
    thumbnail: Storeapp,
  },
  {
    title: "Complaint Tracker",
    link: "#",
    thumbnail: Complaint,
  },
  {
    title: "Innovation Hub",
    link: "#",
    thumbnail: "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=600&h=600&fit=crop",
  },
  {
    title: "Tech Consulting",
    link: "#",
    thumbnail: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=600&fit=crop",
  },
  {
    title: "Billet Tracker",
    link: "#",
    thumbnail: Billet,
  },
  {
    title: "Purchase Managment System",
    link: "#",
    thumbnail: Purchase,
  },
  {
    title: "Salon App",
    link: "#",
    thumbnail: Salon,
  },
  {
    title: "Success Stories",
    link: "#",
    thumbnail: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&h=600&fit=crop",
  },
]

export default function ParallaxSection() {
  return (
    <section className="relative bg-black isolate overflow-hidden">
      {/* Container to isolate the parallax effects */}
      <div className="relative z-0">
        <HeroParallax products={products} />
      </div>
      {/* Smooth transition to next section */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent z-10" />
    </section>
  )
}
