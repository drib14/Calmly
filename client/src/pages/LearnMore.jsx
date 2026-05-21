import React, { useState } from 'react';
import { Shield, BookOpen, ArrowLeft, AlertCircle, Lock, MessageSquare, Heart, Settings, Home, Mail } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const LearnMore = () => {
    const navigate = useNavigate();
    const [faqOpen, setFaqOpen] = useState(null);

    const toggleFaq = (idx) => {
        setFaqOpen(faqOpen === idx ? null : idx);
    };

    const faqs = [
        { q: "Can I unblock someone?", a: "Yes, you can manage your blocked users list in Settings > Moderation." },
        { q: "Will they know I muted them?", a: "No, muting is a private action. They are not notified." },
        { q: "Why was my account restricted?", a: "Accounts are restricted when content violates our community guidelines multiple times." },
        { q: "How long do restrictions last?", a: "Restrictions are reviewed by admins. You can contact support for an appeal." }
    ];

    return (
        <div className="max-w-2xl mx-auto py-12 px-4 pb-32">
            <button onClick={() => navigate(-1)} className="flex items-center space-x-2 text-secondary hover:text-text mb-8 transition">
                <ArrowLeft size={20} />
                <span>Back</span>
            </button>

            <div className="text-center mb-12">
                <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-soft-border">
                    <Shield size={40} className="text-accent" />
                </div>
                <h1 className="text-3xl font-serif font-bold text-text mb-4">Safety & Privacy</h1>
                <p className="text-secondary">Understanding policies and tools on Calmly.</p>
            </div>

            {/* Action Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                <Link to="/feed" className="bg-surface border border-soft-border p-4 rounded-xl flex flex-col items-center justify-center hover:bg-background transition text-center group">
                    <Home size={24} className="text-secondary group-hover:text-text mb-2" />
                    <span className="text-xs font-bold text-text">Home</span>
                </Link>
                <Link to="/settings" className="bg-surface border border-soft-border p-4 rounded-xl flex flex-col items-center justify-center hover:bg-background transition text-center group">
                    <Settings size={24} className="text-secondary group-hover:text-text mb-2" />
                    <span className="text-xs font-bold text-text">Settings</span>
                </Link>
                <button onClick={() => navigate('/settings')} className="bg-surface border border-soft-border p-4 rounded-xl flex flex-col items-center justify-center hover:bg-background transition text-center group">
                    <Mail size={24} className="text-secondary group-hover:text-text mb-2" />
                    <span className="text-xs font-bold text-text">Support</span>
                </button>
                <a href="#" className="bg-surface border border-soft-border p-4 rounded-xl flex flex-col items-center justify-center hover:bg-background transition text-center group">
                    <BookOpen size={24} className="text-secondary group-hover:text-text mb-2" />
                    <span className="text-xs font-bold text-text">Guide</span>
                </a>
            </div>

            <div className="space-y-6">
                <div className="bg-surface p-6 rounded-2xl border border-soft-border">
                    <h2 className="text-xl font-bold text-text mb-3 flex items-center gap-2">
                        <AlertCircle size={20} className="text-red-500" />
                        Account Restrictions
                    </h2>
                    <p className="text-secondary leading-relaxed mb-4">
                        If your account has been restricted:
                    </p>
                    <ul className="list-disc list-inside text-secondary space-y-2 ml-2">
                        <li>You may be temporarily blocked from creating new posts.</li>
                        <li>You may be unable to comment on other users' content.</li>
                        <li>This usually happens if your content was reported and found to violate our guidelines.</li>
                        <li>Contact support via Settings if you believe this is an error.</li>
                    </ul>
                </div>

                <div className="bg-surface p-6 rounded-2xl border border-soft-border">
                    <h2 className="text-xl font-bold text-text mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        Blocking a User
                    </h2>
                    <p className="text-secondary leading-relaxed mb-4">
                        When you block someone:
                    </p>
                    <ul className="list-disc list-inside text-secondary space-y-2 ml-2">
                        <li>They cannot see your profile or posts.</li>
                        <li>They cannot message you. Existing conversations will be disabled.</li>
                        <li>They will not be notified that you blocked them.</li>
                    </ul>
                </div>

                <div className="bg-surface p-6 rounded-2xl border border-soft-border">
                    <h2 className="text-xl font-bold text-text mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        Muting a Conversation
                    </h2>
                    <p className="text-secondary leading-relaxed mb-4">
                        When you mute a conversation:
                    </p>
                    <ul className="list-disc list-inside text-secondary space-y-2 ml-2">
                        <li>You will stop receiving push notifications for new messages.</li>
                        <li>The conversation will lose its 'unread' status badge.</li>
                        <li>The other person will not know they have been muted.</li>
                    </ul>
                </div>

                {/* FAQ Accordion */}
                <div className="bg-surface rounded-2xl border border-soft-border overflow-hidden">
                    <div className="p-6 border-b border-soft-border">
                        <h2 className="text-xl font-bold text-text flex items-center gap-2">
                            <MessageSquare size={20} />
                            Common Questions
                        </h2>
                    </div>
                    {faqs.map((faq, i) => (
                        <div key={i} className="border-b border-soft-border last:border-0">
                            <button
                                onClick={() => toggleFaq(i)}
                                className="w-full text-left p-4 px-6 flex justify-between items-center hover:bg-background transition"
                            >
                                <span className="font-bold text-sm text-text">{faq.q}</span>
                                <span className="text-secondary text-lg">{faqOpen === i ? '-' : '+'}</span>
                            </button>
                            {faqOpen === i && (
                                <div className="px-6 pb-4 text-sm text-secondary leading-relaxed">
                                    {faq.a}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default LearnMore;
