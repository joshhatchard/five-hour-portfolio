export default function Footer({ className = "" }: { className?: string }) {
  return (
    <footer className={`footer ${className}`.trim()}>
      <div className="siteContainer">
        <p>Josh Hatchard © 2026</p>
        <div className="footerRight">
          <p>Live the most</p>
        </div>
        <a className="footerBack" href="#hero">Back to top <span aria-hidden="true">↑</span></a>
      </div>
    </footer>
  );
}
