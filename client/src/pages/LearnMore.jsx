import React from 'react';
import { Shield, BookOpen, ArrowLeft, AlertCircle, Lock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const LearnMore = () => {
    const navigate = useNavigate();

    return (
        <div className="max-w-2xl mx-auto py-12 px-4">
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
                        <li>Contact support if you believe this is an error.</li>
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
                        <li>They will not be notified that you blocked them, but they may infer it if they try to visit your profile.</li>
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
                        <li>The conversation will still appear in your list, but without the unread badge on the main menu.</li>
                        <li>The other person will not know they have been muted.</li>
                    </ul>
                </div>

                <div className="bg-surface p-6 rounded-2xl border border-soft-border">
                    <h2 className="text-xl font-bold text-text mb-3 flex items-center gap-2">
                        <BookOpen size={20} />
                        Community Guidelines
                    </h2>
                    <p className="text-secondary leading-relaxed mb-4">
                        Calmly is a space for authentic expression. We value kindness and respect.
                    </p>
                    <ul className="list-disc list-inside text-secondary space-y-2 ml-2">
                        <li>No hate speech or harassment.</li>
                        <li>Respect privacy and consent.</li>
                        <li>Avoid graphic violence or illegal content.</li>
                        <li>Be supportive. This is a calm space.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default LearnMore;
