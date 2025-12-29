import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Legal = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Link to="/" className="inline-flex items-center text-slate-500 hover:text-slate-900 mb-8 transition">
            <ArrowLeft size={20} className="mr-2" />
            Back to Home
        </Link>

        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-10 rounded-3xl shadow-sm border border-slate-100"
        >
            <h1 className="text-4xl font-serif font-bold mb-10 text-slate-900 pb-6 border-b border-slate-100">Legal Information</h1>

            <section className="mb-10">
                <h2 className="text-2xl font-bold mb-4">Terms of Service</h2>
                <div className="space-y-4 text-slate-600 leading-relaxed text-sm">
                    <p><strong>1. Acceptance of Terms:</strong> By accessing and using Calmly, you accept and agree to be bound by the terms and provision of this agreement.</p>
                    <p><strong>2. User Conduct:</strong> You agree not to use the platform for any unlawful purpose or to solicit others to perform or participate in any unlawful acts. Hate speech, harassment, and threats are strictly prohibited.</p>
                    <p><strong>3. Content Ownership:</strong> You retain all rights to the content you post. However, by posting, you grant Calmly a license to display and distribute your content on the platform.</p>
                    <p><strong>4. Termination:</strong> We reserve the right to terminate or suspend access to our service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>
                </div>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Privacy Policy</h2>
                <div className="space-y-4 text-slate-600 leading-relaxed text-sm">
                    <p><strong>1. Information Collection:</strong> We collect information you provide directly to us, such as when you create an account, post content, or communicate with us.</p>
                    <p><strong>2. Anonymity:</strong> We take your privacy seriously. Content posted under "Anonymous" identities is disassociated from your real identity in our public-facing interface, though metadata is retained for moderation purposes.</p>
                    <p><strong>3. Data Security:</strong> We implement security measures designed to protect your information from unauthorized access, disclosure, alteration, and destruction.</p>
                    <p><strong>4. Cookies:</strong> We use cookies to maintain your session and preference settings. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.</p>
                </div>
            </section>

            <div className="text-xs text-slate-400 mt-12 pt-6 border-t border-slate-100">
                Last updated: {new Date().toLocaleDateString()}
            </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Legal;
