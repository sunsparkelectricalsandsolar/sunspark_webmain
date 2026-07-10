import Link from "next/link";

const categories = [
  {
    name: "Electricals",
    description: "Cables, switches, breakers, fittings, and installation essentials.",
    href: "/category/electricals"
  },
  {
    name: "Solar",
    description: "Panels, inverters, batteries, charge controllers, and complete kits.",
    href: "/category/solar"
  },
  {
    name: "Electronics",
    description: "Reliable electronics and accessories for home and business.",
    href: "/category/electronics"
  }
];

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Nairobi CBD • KSH pricing • WhatsApp orders</p>
            <h1>Sunspark Electrical and Solar</h1>
            <p>
              Shop electricals, electronics, and solar products from Downtown Tower, Duruma Road.
              Built for installers, homes, offices, and businesses that need dependable gear.
            </p>
            <div className="hero-actions">
              <Link className="primary-btn" href="/store">
                Shop products
              </Link>
              <Link className="secondary-btn" href="/checkout">
                Checkout
              </Link>
            </div>
          </div>
          <div className="hero-panel" aria-label="Sunspark product categories">
            {categories.map((category) => (
              <Link className="category-card" href={category.href} key={category.name}>
                <span>{category.name}</span>
                <small>{category.description}</small>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container section-heading">
          <h2>Featured Categories</h2>
          <p>Start with the main Sunspark departments. Products will appear here from the admin dashboard.</p>
        </div>
      </section>
    </>
  );
}
