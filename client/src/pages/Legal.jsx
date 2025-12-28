import React from 'react';

const Legal = () => {
  return (
    <div className="max-w-3xl mx-auto py-10 px-6">
      <h1 className="text-3xl font-serif font-bold text-slate-900 mb-8">Legal & Privacy</h1>

      <div className="space-y-8 text-slate-600 leading-relaxed">
          <section>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Terms of Service</h2>
              <p>By using Calmly, you agree to maintain a supportive environment. Hate speech, harassment, and illegal content are strictly prohibited and will result in account termination. We prioritize the safety of our community above all else.</p>
          </section>

          <section>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Privacy Policy</h2>
              <p>Your privacy is our core feature. We do not sell your data. Anonymous posts are disassociated from your user ID in public views. However, metadata is retained for moderation purposes to comply with legal requirements and prevent abuse.</p>
          </section>

          <section>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Content Safety</h2>
              <p>We use automated filters and community reporting to hide trigger-heavy content. Users can control their content warnings and visibility settings at any time.</p>
          </section>
      </div>
    </div>
  );
};

export default Legal;
