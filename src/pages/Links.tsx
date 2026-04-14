import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Phone, Wrench, Images, Palette, ClipboardCheck, Star, Gift } from "lucide-react";
import axoLogo from "@/assets/axo-logo-official.png";
import woodyMascot from "@/assets/woody-mascot.jpg";

const links = [
  { label: "Get Your Free Estimate", to: "/contact", icon: Calendar, primary: true },
  { label: "Call Us — (732) 351-8653", to: "tel:+17323518653", icon: Phone, primary: true, external: true },
  { label: "Our Services", to: "/", icon: Wrench },
  { label: "See Our Work", to: "/gallery", icon: Images },
  { label: "Stain Gallery", to: "/stain-gallery", icon: Palette },
  { label: "About Us", to: "/about", icon: ClipboardCheck },
  
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

const Links = () => (
  <div className="min-h-screen bg-navy flex flex-col items-center">
    {/* Hero */}
    <div className="relative w-full max-w-lg mx-auto aspect-[3/4] overflow-hidden">
      <motion.img
        src={woodyMascot}
        alt="Woody — AXO Floors mascot"
        className="w-full h-full object-cover object-top"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent via-40% to-[hsl(var(--navy-primary))]" />
      <motion.div
        className="absolute bottom-6 left-0 right-0 text-center text-white px-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <img src={axoLogo} alt="AXO Floors" className="h-12 mx-auto" />
        <p className="text-gold text-sm font-medium mt-1">Premium Flooring Services in NJ, NY & PA</p>
      </motion.div>
    </div>

    {/* Links */}
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="w-full max-w-sm mx-auto px-4 py-6 flex flex-col gap-3"
    >
      {links.map((l) => {
        const Icon = l.icon;
        const cls = `flex items-center gap-3 w-full rounded-xl px-5 py-3.5 font-heading font-semibold text-sm transition-all duration-200 ${
          l.primary
            ? "gold-gradient text-black hover:scale-[1.03]"
            : "bg-white/10 text-white hover:bg-white/20"
        }`;

        return (
          <motion.div key={l.label} variants={item}>
            {l.external ? (
              <a href={l.to} target={l.to.startsWith("tel") ? undefined : "_blank"} rel="noopener noreferrer" className={cls}>
                <Icon className="w-5 h-5 shrink-0" />
                {l.label}
              </a>
            ) : (
              <Link to={l.to} className={cls}>
                <Icon className="w-5 h-5 shrink-0" />
                {l.label}
              </Link>
            )}
          </motion.div>
        );
      })}
    </motion.div>

    {/* Social */}
    <div className="flex gap-6 mt-2 mb-4">
      <a href="https://www.instagram.com/axofloors" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-gold transition-colors">
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
      </a>
      <a href="https://www.facebook.com/axofloors" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-gold transition-colors">
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
      </a>
    </div>

    <p className="text-white/30 text-xs pb-6">© 2026 AXO Floors</p>
  </div>
);

export default Links;
