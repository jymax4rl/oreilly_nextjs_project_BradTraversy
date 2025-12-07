import Link from "next/link"; // Or 'react-router-dom'
import { FaInstagram, FaTwitter, FaLinkedin, FaFacebook } from "react-icons/fa"; // Optional icons

const Footer = () => {
  return (
    <footer className="bg-zinc-950 text-zinc-400 relative pt-24 pb-12 overflow-hidden font-sans">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Top Section: CTA & Links */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-24">
          {/* Left: Call to Action */}
          <div className="space-y-6">
            <h3 className="text-3xl md:text-5xl font-semibold text-white tracking-tight">
              Ready to find your <br />
              <span className="text-blue-500">dream property?</span>
            </h3>
            <p className="max-w-md text-lg text-zinc-500">
              Join thousands of satisfied clients who found their perfect home
              with Kama Properties. Let's start the conversation.
            </p>
            <div className="flex gap-4 pt-4">
              <button className="bg-white text-black px-8 py-3 rounded-full font-medium hover:bg-zinc-200 transition-colors">
                Get Started
              </button>
            </div>
          </div>

          {/* Right: Navigation Links */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 lg:gap-12">
            {/* Column 1 */}
            <div className="flex flex-col space-y-4">
              <h4 className="text-white font-medium mb-2">Company</h4>
              <FooterLink href="/about">About</FooterLink>
              <FooterLink href="/careers">Careers</FooterLink>
              <FooterLink href="/press">Press</FooterLink>
              <FooterLink href="/contact">Contact</FooterLink>
            </div>

            {/* Column 2 */}
            <div className="flex flex-col space-y-4">
              <h4 className="text-white font-medium mb-2">Resources</h4>
              <FooterLink href="/blog">Blog</FooterLink>
              <FooterLink href="/guides">Guides</FooterLink>
              <FooterLink href="/help">Help Center</FooterLink>
              <FooterLink href="/partners">Partners</FooterLink>
            </div>

            {/* Column 3 */}
            <div className="flex flex-col space-y-4">
              <h4 className="text-white font-medium mb-2">Legal</h4>
              <FooterLink href="/terms">Terms</FooterLink>
              <FooterLink href="/privacy">Privacy</FooterLink>
              <FooterLink href="/cookies">Cookies</FooterLink>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-zinc-800 mb-12"></div>

        {/* Bottom Section: Socials & Copyright */}
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-6">
          <div className="flex gap-6 text-2xl">
            <a href="#" className="hover:text-white transition-colors">
              <FaInstagram />
            </a>
            <a href="#" className="hover:text-white transition-colors">
              <FaTwitter />
            </a>
            <a href="#" className="hover:text-white transition-colors">
              <FaLinkedin />
            </a>
            <a href="#" className="hover:text-white transition-colors">
              <FaFacebook />
            </a>
          </div>
          <p className="text-sm hover:text-white transition-colors cursor-pointer ">
            © 2025 Kama Properties Inc.
          </p>
        </div>

        {/* Giant Footer Title (Modern Trend) */}
        <div className="mt-20 border-t border-zinc-900 pt-8 text-center">
          <h1 className="text-[12vw] cursor-pointer leading-none font-bold text-zinc-900 select-none tracking-tighter hover:text-zinc-800 transition-colors duration-500">
            KAMA PROPERTIES
          </h1>
        </div>
      </div>
    </footer>
  );
};

// Helper Component for consistent link styling
const FooterLink = ({ href, children }) => {
  return (
    <Link
      href={href}
      className="hover:text-white hover:translate-x-1 transition-all duration-300 ease-in-out"
    >
      {children}
    </Link>
  );
};

export default Footer;
