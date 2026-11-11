import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';
import logo from '../../../assets/images/logo.png';

interface BrandLogoProps {
  hideText?: boolean;
  to?: string;
  className?: string;
  'aria-label'?: string;
}

export function BrandLogo({ hideText = false, to = '/', className, 'aria-label': ariaLabel }: BrandLogoProps) {
  return (
    <Link
      to={to}
      aria-label={ariaLabel}
      className={['inline-flex w-fit items-center gap-2', className].filter(Boolean).join(' ')}
    >
      <Avatar className="size-7 rounded-lg">
        <AvatarImage src={logo} alt="Vizibble Logo" className="object-cover" />
        <AvatarFallback className="bg-primary text-primary-foreground rounded-lg text-sm font-bold">V</AvatarFallback>
      </Avatar>
      {!hideText && <span className="text-foreground text-xl font-bold tracking-tight">Vizibble</span>}
    </Link>
  );
}
