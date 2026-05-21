import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import Modal from './Modal';
import Avatar from './Avatar';
import clsx from 'clsx';

const ReactorsModal = ({ isOpen, onClose, title = "Liked by", reactors = [] }) => {
  const navigate = useNavigate();

  const handleProfileClick = (identity) => {
    onClose();
    if (identity.handle) {
        navigate(`/profile/${identity.handle.replace('@', '')}`);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-soft-border">
        <h3 className="text-lg font-bold text-text">{title}</h3>
        <button onClick={onClose} className="p-1 hover:bg-background rounded-full transition text-secondary hover:text-text">
          <X size={20} />
        </button>
      </div>

      <div className="max-h-[60vh] overflow-y-auto custom-scrollbar -mx-2 px-2 space-y-2">
        {reactors.length === 0 ? (
            <p className="text-center text-secondary py-4 text-sm">No reactions yet.</p>
        ) : (
            reactors.map((identity) => (
                <div
                    key={identity._id}
                    onClick={() => handleProfileClick(identity)}
                    className="flex items-center space-x-3 p-2 rounded-xl hover:bg-background transition cursor-pointer group"
                >
                    <Avatar identity={identity} size="sm" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-text truncate group-hover:underline decoration-slate-400 underline-offset-2">
                            {identity.name}
                        </p>
                        <p className="text-xs text-secondary truncate">
                            {identity.handle}
                        </p>
                    </div>
                </div>
            ))
        )}
      </div>
    </Modal>
  );
};

export default ReactorsModal;
