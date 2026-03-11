import Link from 'next/link';

interface Email {
  id: string;
  read: boolean;
  avatarColor: string;
  sender: string;
  time: string;
  tagline: string;
}

interface EmailCardProps {
  email: Email;
  onContextMenu: (e: React.MouseEvent, emailId: string) => void;
}

export function EmailCard({ email, onContextMenu }: EmailCardProps) {
  return (
    <Link
      href={`/email/${email.id}`}
      className="block"
      onContextMenu={(e) => onContextMenu(e, email.id)}
    >
      <div
        className={`flex items-center gap-3 p-2 bg-white rounded-lg hover:bg-grey-05 transition-colors cursor-default ${
          email.read ? 'stripe-read' : ''
        }`}
        style={{
          boxShadow:
            '0px 0px 0px 1px rgba(242,242,242,0.50), 0px 0px 0px 1px rgba(150,150,150,0.08)',
        }}
      >
        {/* Unread indicator */}
        <div className="w-3 h-3 flex items-center justify-center flex-shrink-0">
          <span className="sr-only">{email.read ? 'Read' : 'Unread'}</span>
          {!email.read && (
            <span
              aria-hidden="true"
              className="w-2.5 h-2.5 rounded-full block bg-success-300 shadow-[inset_1px_1px_4px_1px_rgba(208,253,228,1.00),inset_0px_-1px_4px_0px_rgba(11,226,151,0.50)]"
            />
          )}
        </div>

        {/* Avatar */}
        <div aria-hidden="true" className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center bg-grey-5">
          <span
            className="text-[7px] font-bold leading-none tracking-tight"
            style={{ color: email.avatarColor }}
          >
            daily
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex justify-between items-center">
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center">
              <p className="text-sm font-semibold text-grey-4 font-['Figtree'] leading-6 truncate">
                {email.sender}
              </p>
              <span className="text-sm font-medium text-grey-2 font-['Figtree'] leading-6 flex-shrink-0 ml-2">
                {email.time}
              </span>
            </div>
            <p className="text-sm font-medium text-grey-3 font-['Figtree'] leading-6 truncate">
              {email.tagline}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
