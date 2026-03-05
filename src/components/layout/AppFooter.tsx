import React from 'react'

export const AppFooter = () => {
  return (
    <footer id="public-site-footer" className="shell-footer">
      <div className="shell-container py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Dog Trainers Directory</h3>
            <p className="text-slate-200/80 text-sm">
              Connecting Melbourne dog owners with qualified trainers and emergency resources
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-base font-medium mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/search" className="shell-footer-link inline-flex min-h-[44px] items-center">
                  Find a Trainer
                </a>
              </li>
              <li>
                <a href="/emergency" className="shell-footer-link inline-flex min-h-[44px] items-center">
                  Emergency Help
                </a>
              </li>
              <li>
                <a href="/onboarding" className="shell-footer-link inline-flex min-h-[44px] items-center">
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
                <a href="/privacy" className="shell-footer-link inline-flex min-h-[44px] items-center">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms" className="shell-footer-link inline-flex min-h-[44px] items-center">
                  Terms of Use
                </a>
              </li>
              <li>
                <a href="/disclaimer" className="shell-footer-link inline-flex min-h-[44px] items-center">
                  Disclaimer
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-300/20 text-center text-sm text-slate-300/75">
          <p>&copy; {new Date().getFullYear()} Dog Trainers Directory. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
