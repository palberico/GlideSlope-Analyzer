import { Link } from 'react-router-dom';
import { UserMenu } from './UserMenu';

interface HeaderProps {
  subtitle: string;
  /** Analyzer links the title back home; Landing is already home. */
  linkToHome?: boolean;
  /** Only the analyzer has saved flights to show, so only it passes this. */
  onOpenSavedFlights?: () => void;
}

export function Header({ subtitle, linkToHome = false, onOpenSavedFlights }: HeaderProps) {
  const title = <h1>Approach&nbsp;Review</h1>;

  return (
    <header className="top">
      {linkToHome ? (
        <Link to="/" aria-label="Return to home">
          {title}
        </Link>
      ) : (
        title
      )}
      <span className="sub">Glideslope&nbsp;{subtitle}</span>
      <span className="spacer" style={{ flex: 1 }} />
      <Link to="/docs" className="navlink">
        Docs
      </Link>
      <UserMenu onOpenSavedFlights={onOpenSavedFlights} />
    </header>
  );
}
