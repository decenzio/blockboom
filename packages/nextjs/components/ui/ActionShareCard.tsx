"use client";

import ShareButton from "./ShareButton";

interface ActionShareCardProps {
  title: string;
  description: string;
  actionText?: string;
  embedPath?: string;
}

const ActionShareCard: React.FC<ActionShareCardProps> = ({ title, description, actionText = "Share", embedPath }) => {
  return (
    <div className="card bg-gradient-to-br from-primary/10 to-secondary/10 shadow-xl border border-base-content/10">
      <div className="card-body p-4 sm:p-6 text-center">
        <div className="text-4xl mb-2">📣</div>
        <h3 className="text-lg sm:text-xl font-semibold mb-2">{title}</h3>
        <p className="text-sm sm:text-base text-base-content/70 mb-4">{description}</p>
        <ShareButton
          label={actionText}
          intent={{
            text: `${title} — ${description}`,
            embedPath,
          }}
        />
      </div>
    </div>
  );
};

export default ActionShareCard;
