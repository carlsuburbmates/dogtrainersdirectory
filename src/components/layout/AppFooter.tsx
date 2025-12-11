import React from 'react'

export const AppFooter = () => {
  return (
    <footer className="bg-gray-800 text-white mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Dog Trainers Directory</h3>
            <p className="text-gray-300 text-sm">
              Connecting Melbourne dog owners with qualified trainers and emergency resources
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-base font-medium mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/search" className="text-gray-300 hover:text-white transition">
                  Find a Trainer
                </a>
              </li>
              <li>
                <a href="/help/emergency" className="text-gray-300 hover:text-white transition">
                  Emergency Help
                </a>
              </li>
              <li>
                <a href="/onboarding" className="text-gray-300 hover:text-white transition">
                  List Your Business
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-base font-medium mb-3">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/privacy" className="text-gray-300 hover:text-white transition">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms" className="text-gray-300 hover:text-white transition">
                  Terms of Use
                </a>
              </li>
              <li>
                <a href="/disclaimer" className="text-gray-300 hover:text-white transition">
                  Disclaimer
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-700 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} Dog Trainers Directory. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}