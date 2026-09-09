import Logo from './Logo'

export default function Footer() {
  return (
    <footer className="border-t border-line px-6 py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 sm:flex-row">
        <Logo />
        <div className="flex items-center gap-3 text-xs text-paper-muted">
          <span>Crafted by</span>
          <img
            src="/assets/yendigital-logo.png"
            alt="yenDigital"
            width={72}
            height={54}
            className="h-9 w-auto rounded-md bg-paper p-1"
          />
        </div>
        <p className="text-xs text-paper-muted">
          © {new Date().getFullYear()} YenDigital · T-tracker
        </p>
      </div>
    </footer>
  )
}
