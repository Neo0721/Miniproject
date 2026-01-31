'use client'

import Link from 'next/link'
import { Mail, Phone, MapPin, Github, Twitter, Linkedin } from 'lucide-react'

export function AppFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-primary text-primary-foreground py-12 px-4 sm:px-6 lg:px-8 mt-16">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3 className="font-bold text-lg mb-2">HCAP</h3>
            <p className="text-sm text-primary-foreground/80 leading-relaxed">
              Empowering communities through transparent issue tracking and collaborative problem-solving.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="text-primary-foreground/80 hover:text-primary-foreground transition">Home</Link></li>
              <li><Link href="/login" className="text-primary-foreground/80 hover:text-primary-foreground transition">Login</Link></li>
              <li><Link href="/report-issue" className="text-primary-foreground/80 hover:text-primary-foreground transition">Report Issue</Link></li>
              <li><Link href="/dashboard" className="text-primary-foreground/80 hover:text-primary-foreground transition">Dashboard</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="mailto:support@hcap.local" className="text-primary-foreground/80 hover:text-primary-foreground transition">Contact Support</a></li>
              <li><a href="#" className="text-primary-foreground/80 hover:text-primary-foreground transition">FAQs</a></li>
              <li><a href="#" className="text-primary-foreground/80 hover:text-primary-foreground transition">Documentation</a></li>
              <li><a href="#" className="text-primary-foreground/80 hover:text-primary-foreground transition">Report Bug</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <a href="mailto:hello@hcap.local" className="text-primary-foreground/80 hover:text-primary-foreground transition">hello@hcap.local</a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <a href="tel:+1234567890" className="text-primary-foreground/80 hover:text-primary-foreground transition">+1 (234) 567-890</a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="text-primary-foreground/80">Community Center, Main Street</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-primary-foreground/20 pt-8 mb-6">
          {/* Social Links */}
          <div className="flex justify-center gap-4 mb-6">
            <a href="#" className="p-2 rounded-lg hover:bg-primary-foreground/10 transition" aria-label="GitHub">
              <Github className="w-5 h-5" />
            </a>
            <a href="#" className="p-2 rounded-lg hover:bg-primary-foreground/10 transition" aria-label="Twitter">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="#" className="p-2 rounded-lg hover:bg-primary-foreground/10 transition" aria-label="LinkedIn">
              <Linkedin className="w-5 h-5" />
            </a>
          </div>

          {/* Copyright & Legal */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-primary-foreground/60">
            <p>&copy; {currentYear} Hyperlocal Community Action Platform. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-primary-foreground transition">Privacy Policy</a>
              <a href="#" className="hover:text-primary-foreground transition">Terms of Service</a>
              <a href="#" className="hover:text-primary-foreground transition">Cookies</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
