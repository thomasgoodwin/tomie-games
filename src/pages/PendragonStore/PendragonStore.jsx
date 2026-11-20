import { useEffect, useMemo, useState } from "react";
import { Dialog, Portal } from "@chakra-ui/react";
import { LuCheck, LuMinus, LuPlus, LuRotateCcw, LuScrollText, LuSearch, LuShoppingBag, LuTrash2 } from "react-icons/lu";
import { v4 as uuidv4 } from "uuid";
import { PRICE_LIST } from "./priceList";
import { STAGS_PER_DRAGON, formatMoney, formatPurse } from "./money";
import { CATEGORY_COUNTS, CATEGORY_GROUPS, DETAILS_BY_ID, GROUP_BY_CATEGORY, ORDERED_CATEGORIES } from "./catalog";
import { THEMES, themeById, themeVars } from "./themes";
import "./PendragonStore.css";

const STORAGE_KEY = "pendragon-store";
const THEME_KEY = "pendragon-store-theme";
const DEFAULT_STATE = { money: 0, cart: [], purchases: [] };

const ITEMS_BY_ID = Object.fromEntries(PRICE_LIST.map((item) => [item.id, item]));

const toInt = (text) => {
  const n = parseInt(text, 10);
  return Number.isNaN(n) ? 0 : n;
};

const loadState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_STATE;
    }
    const parsed = JSON.parse(raw);
    return {
      money: Number.isFinite(parsed.money) ? parsed.money : 0,
      cart: Array.isArray(parsed.cart) ? parsed.cart.filter((line) => ITEMS_BY_ID[line.itemId]) : [],
      purchases: Array.isArray(parsed.purchases) ? parsed.purchases : [],
    };
  } catch {
    return DEFAULT_STATE;
  }
};

const loadTheme = () => {
  try {
    return themeById(localStorage.getItem(THEME_KEY)).id;
  } catch {
    return themeById(null).id;
  }
};

const plural = (count, word) => {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
};

// keeps the typed text separate from the number so the field can be cleared while typing
const NumberField = ({ value, onChange, min = 0, label, className }) => {
  const [text, setText] = useState(String(value));
  const [lastValue, setLastValue] = useState(value);

  if (value !== lastValue) {
    setLastValue(value);
    if (toInt(text) !== value) {
      setText(String(value));
    }
  }

  return <input
    className={className}
    type="number"
    inputMode="numeric"
    min={min}
    aria-label={label}
    value={text}
    onChange={(e) => {
      setText(e.target.value);
      if (e.target.value !== "") {
        onChange(Math.max(min, toInt(e.target.value)));
      }
    }}
    onBlur={() => setText(String(value))}
  />
};

const Coin = ({ kind }) => {
  return <span className={`ps-coin ps-coin-${kind}`} aria-hidden="true" />
};

const Price = ({ stags }) => {
  if (stags === null) {
    return null;
  }
  if (stags === 0) {
    return <div className="ps-price ps-free">Free</div>
  }
  const gold = Math.floor(stags / STAGS_PER_DRAGON);
  const silver = stags % STAGS_PER_DRAGON;
  return <div className="ps-price">
    {gold > 0 && <span><Coin kind="gold" />{gold.toLocaleString()}g</span>}
    {silver > 0 && <span><Coin kind="silver" />{silver}s</span>}
  </div>
};

const Stepper = ({ name, qty, min = 0, onChange, className = "" }) => {
  return <div className={`ps-stepper ${className}`}>
    <button type="button" aria-label={`One fewer ${name}`} disabled={qty <= min} onClick={() => onChange(qty - 1)}>
      <LuMinus />
    </button>
    <NumberField className="ps-stepper-input" value={qty} min={Math.max(1, min)} label={`${name} quantity`} onChange={onChange} />
    <button type="button" aria-label={`One more ${name}`} onClick={() => onChange(qty + 1)}>
      <LuPlus />
    </button>
  </div>
};

const ThemeBar = ({ themeId, onChange }) => {
  return <div className="ps-themebar">
    <div className="ps-container ps-themebar-inner" role="group" aria-label="Theme">
      {THEMES.map((theme) => {
        return <button
          key={theme.id}
          type="button"
          className="ps-theme-pill"
          aria-pressed={theme.id === themeId}
          onClick={() => onChange(theme.id)}
        >
          <img src={theme.sigil} alt="" />
          <span className="ps-theme-house">{theme.house.replace("House ", "")}</span>
        </button>
      })}
    </div>
  </div>
};

const CategoryNav = ({ active, searching, onSelect }) => {
  return <nav className="ps-nav" aria-label="Categories">
    <div className="ps-nav-groups">
      {CATEGORY_GROUPS.map((group) => {
        return <div key={group.name} className="ps-nav-group">
          <div className="ps-nav-group-name">{group.name}</div>
          {group.categories.map((category) => {
            return <button
              key={category}
              type="button"
              className="ps-nav-item"
              aria-current={!searching && category === active ? "page" : undefined}
              onClick={() => onSelect(category)}
            >
              <span>{category}</span>
              <span className="ps-nav-count">{CATEGORY_COUNTS[category]}</span>
            </button>
          })}
        </div>
      })}
    </div>
    <div className="ps-nav-chips">
      {ORDERED_CATEGORIES.map((category) => {
        return <button
          key={category}
          type="button"
          className="ps-chip"
          aria-current={!searching && category === active ? "page" : undefined}
          onClick={() => onSelect(category)}
        >
          {category}
        </button>
      })}
    </div>
  </nav>
};

const ItemCard = ({ item, qty, showCategory, onSetQty }) => {
  const { text, source, stats } = DETAILS_BY_ID[item.id];

  let action;
  if (item.price === null) {
    action = <span className="ps-gift">Gift only</span>;
  } else if (qty > 0) {
    action = <Stepper className="ps-stepper-accent" name={item.name} qty={qty} onChange={(n) => onSetQty(item.id, n)} />;
  } else {
    action = <button type="button" className="ps-btn ps-btn-accent" aria-label={`Add ${item.name} to cart`} onClick={() => onSetQty(item.id, 1)}>
      Add to cart
    </button>;
  }

  return <article className={`ps-card${qty > 0 ? " ps-card-in-cart" : ""}`}>
    <div className="ps-card-body">
      <div className="ps-card-title">
        <h3>{item.name}</h3>
        {showCategory && <span className="ps-muted-sm">{item.category}</span>}
        {item.notes && <span className="ps-note">{item.notes}</span>}
      </div>
      <p className="ps-card-desc">
        {text} {source && <span className="ps-source">{source}</span>}
      </p>
      {stats.length > 0 && <div className="ps-stats">
        {stats.map((stat) => {
          return <span className="ps-stat" key={stat.label}>
            <span className="ps-stat-label">{stat.label}</span>
            <span className="ps-stat-value">{stat.value}</span>
          </span>
        })}
      </div>}
    </div>
    <div className="ps-card-buy">
      <Price stags={item.price} />
      <div className="ps-card-action">{action}</div>
    </div>
  </article>
};

const Totals = ({ money, total }) => {
  const remaining = money - total;
  return <>
    <dl className="ps-totals">
      <dt>Purse</dt>
      <dd>{formatPurse(money)}</dd>
      <dt>Cart total</dt>
      <dd>{formatPurse(total)}</dd>
      <dt className="ps-totals-strong">Left after</dt>
      <dd className={`ps-totals-strong${remaining < 0 ? " ps-danger-text" : ""}`}>{formatPurse(remaining)}</dd>
    </dl>
    {remaining < 0 && <p className="ps-alert" role="alert">
      Short by {formatMoney(-remaining)}. Remove something or add coin to the purse.
    </p>}
  </>
};

const CartPanel = ({ lines, count, money, total, onSetQty, onReview, onClear }) => {
  const canBuy = lines.length > 0 && total <= money;

  return <aside className="ps-cart" aria-label="Cart">
    <div className="ps-cart-head">
      <h2><LuShoppingBag aria-hidden="true" /> Cart</h2>
      <span className="ps-muted-sm">{plural(count, "item")}</span>
    </div>
    {lines.length === 0 && <p className="ps-empty">Nothing in the cart yet.</p>}
    <div className="ps-cart-lines">
      {lines.map(({ item, qty }) => {
        return <div className="ps-cart-line" key={item.id}>
          <div className="ps-cart-line-name">
            <div>{item.name}</div>
            <div className="ps-muted-sm">{formatMoney(item.price)} each</div>
          </div>
          <Stepper className="ps-stepper-small" name={item.name} qty={qty} onChange={(n) => onSetQty(item.id, n)} />
          <div className="ps-cart-line-total">{formatMoney(item.price * qty)}</div>
        </div>
      })}
    </div>
    <Totals money={money} total={total} />
    <button type="button" className="ps-btn ps-btn-accent ps-btn-block" disabled={!canBuy} onClick={onReview}>
      Review purchase
    </button>
    {lines.length > 0 && <button type="button" className="ps-btn ps-btn-ghost" onClick={onClear}>Empty cart</button>}
  </aside>
};

const MobileCartBar = ({ count, total, onReview }) => {
  if (count === 0) {
    return null;
  }
  return <button type="button" className="ps-cartbar" onClick={onReview}>
    <span className="ps-cartbar-summary">
      <LuShoppingBag aria-hidden="true" />
      {plural(count, "item")} · {formatPurse(total)}
    </span>
    <span className="ps-cartbar-action">Review</span>
  </button>
};

const StoreDialog = ({ open, onOpenChange, vars, role, size = "lg", children }) => {
  return <Dialog.Root
    role={role}
    motionPreset="slide-in-bottom"
    lazyMount
    unmountOnExit
    scrollBehavior="inside"
    size={size}
    open={open}
    onOpenChange={(e) => onOpenChange(e.open)}
  >
    <Portal>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content className="ps-dialog" style={vars} bg="var(--ps-surf)" color="var(--ps-text)">
          {children}
        </Dialog.Content>
      </Dialog.Positioner>
    </Portal>
  </Dialog.Root>
};

const CheckoutModal = ({ open, onOpenChange, vars, lines, money, receipt, onSetQty, onRemove, onConfirm, onViewPurchases }) => {
  const total = lines.reduce((sum, line) => sum + line.item.price * line.qty, 0);
  const remaining = money - total;
  const short = remaining < 0;
  const spent = money > 0 ? Math.min(100, Math.round((total / money) * 100)) : 100;

  if (receipt) {
    return <StoreDialog open={open} onOpenChange={onOpenChange} vars={vars} size="md">
      <Dialog.Body className="ps-receipt">
        <span className="ps-receipt-mark"><LuCheck aria-hidden="true" /></span>
        <Dialog.Title className="ps-dialog-title">Purchase recorded</Dialog.Title>
        <p>You paid {formatPurse(receipt.total)}. Your purse now holds {formatPurse(receipt.remaining)}.</p>
      </Dialog.Body>
      <Dialog.Footer className="ps-dialog-footer">
        <button type="button" className="ps-btn ps-btn-outline" onClick={onViewPurchases}>View purchases</button>
        <button type="button" className="ps-btn ps-btn-accent" onClick={() => onOpenChange(false)}>Back to the store</button>
      </Dialog.Footer>
    </StoreDialog>
  }

  return <StoreDialog open={open} onOpenChange={onOpenChange} vars={vars}>
    <Dialog.Header className="ps-dialog-header">
      <div className="ps-eyebrow">Checkout</div>
      <Dialog.Title className="ps-dialog-title">Review purchase</Dialog.Title>
    </Dialog.Header>
    <Dialog.Body>
      {lines.length === 0 && <p className="ps-empty">Your cart is empty.</p>}
      <div className="ps-checkout-lines">
        {lines.map(({ item, qty }) => {
          return <div className="ps-checkout-line" key={item.id}>
            <div className="ps-checkout-name">
              <div className="ps-checkout-item">{item.name}</div>
              <div className="ps-muted-sm">{item.category} · {formatMoney(item.price)} each</div>
            </div>
            <Stepper name={item.name} qty={qty} min={1} onChange={(n) => onSetQty(item.id, n)} />
            <div className="ps-checkout-total">{formatMoney(item.price * qty)}</div>
            <button type="button" className="ps-icon-btn ps-danger-text" aria-label={`Remove ${item.name}`} onClick={() => onRemove(item.id)}>
              <LuTrash2 />
            </button>
          </div>
        })}
      </div>
    </Dialog.Body>
    <Dialog.Footer className="ps-checkout-footer">
      <div className="ps-checkout-summary">
        <div className="ps-row">
          <span className="ps-muted">Purse</span>
          <span>{formatPurse(money)}</span>
        </div>
        <div className="ps-spend-bar" role="img" aria-label={`This purchase spends ${spent}% of your purse`}>
          <div className={short ? "ps-spend-short" : undefined} style={{ width: `${spent}%` }} />
        </div>
        <div className="ps-row">
          <span className="ps-muted">Total</span>
          <span className="ps-checkout-grand">{formatPurse(total)}</span>
        </div>
        <div className="ps-row ps-row-divided">
          <strong>Left in purse</strong>
          <strong className={short ? "ps-danger-text" : "ps-acc-text"}>{formatPurse(remaining)}</strong>
        </div>
        {short && <p className="ps-danger-text ps-small" role="alert">You can't afford this. Remove something or add coin to the purse.</p>}
      </div>
      <div className="ps-dialog-footer">
        <button type="button" className="ps-btn ps-btn-outline" onClick={() => onOpenChange(false)}>Keep shopping</button>
        <button type="button" className="ps-btn ps-btn-accent" disabled={lines.length === 0 || short} onClick={onConfirm}>
          Confirm purchase
        </button>
      </div>
    </Dialog.Footer>
  </StoreDialog>
};

const PurchasesModal = ({ open, onOpenChange, vars, purchases }) => {
  const totalSpent = purchases.reduce((sum, p) => sum + p.total, 0);

  return <StoreDialog open={open} onOpenChange={onOpenChange} vars={vars}>
    <Dialog.Header className="ps-dialog-header ps-ledger-head">
      <div>
        <div className="ps-eyebrow">Ledger</div>
        <Dialog.Title className="ps-dialog-title">Purchases</Dialog.Title>
      </div>
      <div className="ps-ledger-spent">
        <div className="ps-label">Total spent</div>
        <div className="ps-ledger-spent-value">{formatPurse(totalSpent)}</div>
      </div>
    </Dialog.Header>
    <Dialog.Body>
      {purchases.length === 0 && <p className="ps-empty">You haven't bought anything yet.</p>}
      <div className="ps-ledger">
        {[...purchases].reverse().map((purchase) => {
          const date = new Date(purchase.date);
          return <section className="ps-ledger-entry" key={purchase.id}>
            <div className="ps-ledger-entry-head">
              <div>
                <span className="ps-ledger-date">{date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}</span>
                <span className="ps-muted-sm">{date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</span>
              </div>
              <span className="ps-ledger-total">{formatPurse(purchase.total)}</span>
            </div>
            <ul className="ps-ledger-lines">
              {purchase.lines.map((line) => {
                return <li key={line.itemId}>
                  <span><span className="ps-ledger-qty">{line.qty}×</span>{line.name}</span>
                  <span className="ps-muted">{formatMoney(line.unitPrice * line.qty)}</span>
                </li>
              })}
            </ul>
          </section>
        })}
      </div>
    </Dialog.Body>
    <Dialog.Footer className="ps-dialog-footer">
      <button type="button" className="ps-btn ps-btn-accent" onClick={() => onOpenChange(false)}>Back to the store</button>
    </Dialog.Footer>
  </StoreDialog>
};

const ResetModal = ({ open, onOpenChange, vars, onReset }) => {
  return <StoreDialog role="alertdialog" open={open} onOpenChange={onOpenChange} vars={vars} size="sm">
    <Dialog.Header className="ps-dialog-header">
      <Dialog.Title className="ps-dialog-title">Reset the store?</Dialog.Title>
    </Dialog.Header>
    <Dialog.Body>
      <p>This clears your money, cart and purchase history. Continue?</p>
    </Dialog.Body>
    <Dialog.Footer className="ps-dialog-footer">
      <button type="button" className="ps-btn ps-btn-outline" onClick={() => onOpenChange(false)}>Cancel</button>
      <button type="button" className="ps-btn ps-btn-danger-solid" onClick={onReset}>Reset</button>
    </Dialog.Footer>
  </StoreDialog>
};

const PendragonStore = () => {
  const [state, setState] = useState(loadState);
  const [themeId, setThemeId] = useState(loadTheme);
  const [active, setActive] = useState(ORDERED_CATEGORIES[0]);
  const [query, setQuery] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const { money, cart, purchases } = state;

  const theme = themeById(themeId);
  const vars = useMemo(() => themeVars(theme), [theme]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // storage can be blocked, the store still works for this visit
    }
  }, [state]);

  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, themeId);
    } catch {
      // same as above
    }
  }, [themeId]);

  const search = query.trim().toLowerCase();
  const visibleItems = useMemo(() => {
    if (search) {
      return PRICE_LIST.filter((item) => `${item.name} ${item.category} ${item.description}`.toLowerCase().includes(search));
    }
    return PRICE_LIST.filter((item) => item.category === active);
  }, [search, active]);

  const cartQty = useMemo(() => {
    return Object.fromEntries(cart.map((line) => [line.itemId, line.qty]));
  }, [cart]);

  const cartLines = cart.map((line) => ({ item: ITEMS_BY_ID[line.itemId], qty: line.qty }));
  const cartCount = cart.reduce((sum, line) => sum + line.qty, 0);
  const cartTotal = cartLines.reduce((sum, line) => sum + line.item.price * line.qty, 0);
  const gold = Math.floor(money / STAGS_PER_DRAGON);
  const silver = money % STAGS_PER_DRAGON;

  const setMoney = (value) => {
    setState((s) => ({ ...s, money: Math.max(0, value) }));
  };

  const setQty = (itemId, qty) => {
    setState((s) => {
      if (qty <= 0) {
        return { ...s, cart: s.cart.filter((line) => line.itemId !== itemId) };
      }
      if (s.cart.some((line) => line.itemId === itemId)) {
        return { ...s, cart: s.cart.map((line) => line.itemId === itemId ? { ...line, qty } : line) };
      }
      return { ...s, cart: [...s.cart, { itemId, qty }] };
    });
  };

  const selectCategory = (category) => {
    setActive(category);
    setQuery("");
  };

  const openCheckout = () => {
    setReceipt(null);
    setCheckoutOpen(true);
  };

  const confirmPurchase = () => {
    if (cartLines.length === 0 || cartTotal > money) {
      return;
    }
    const lines = cartLines.map(({ item, qty }) => ({ itemId: item.id, name: item.name, qty, unitPrice: item.price }));
    setState((s) => ({
      money: s.money - cartTotal,
      cart: [],
      purchases: [...s.purchases, { id: uuidv4(), date: new Date().toISOString(), lines, total: cartTotal }],
    }));
    setReceipt({ total: cartTotal, remaining: money - cartTotal });
  };

  const reset = () => {
    setState(DEFAULT_STATE);
    setResetOpen(false);
  };

  return <div className="ps-page" style={vars}>
    <ThemeBar themeId={themeId} onChange={setThemeId} />

    <header className="ps-header">
      <div className="ps-container ps-header-inner">
        <div className="ps-brand">
          <img className="ps-brand-sigil" src={theme.sigil} alt={`Sigil of ${theme.house}`} />
          <div>
            <h1 className="ps-title">Pendragon Store</h1>
          </div>
        </div>

        <div className="ps-purse">
          <span className="ps-label">Purse</span>
          <label className="ps-coin-field">
            <Coin kind="gold" />
            <NumberField className="ps-coin-input" value={gold} label="Gold dragons" onChange={(g) => setMoney(g * STAGS_PER_DRAGON + silver)} />
            <span className="ps-muted">gold</span>
          </label>
          <label className="ps-coin-field">
            <Coin kind="silver" />
            <NumberField className="ps-coin-input ps-coin-input-silver" value={silver} label="Silver stags" onChange={(s) => setMoney(gold * STAGS_PER_DRAGON + s)} />
            <span className="ps-muted">silver</span>
          </label>
          <span className="ps-hint">240 silver stags = 1 gold dragon</span>
        </div>

        <div className="ps-header-actions">
          <button type="button" className="ps-btn ps-btn-outline" onClick={() => setHistoryOpen(true)}>
            <LuScrollText aria-hidden="true" /> Purchases
          </button>
          <button type="button" className="ps-btn ps-btn-danger" onClick={() => setResetOpen(true)}>
            <LuRotateCcw aria-hidden="true" /> Reset
          </button>
        </div>
      </div>
    </header>

    <div className="ps-container ps-layout">
      <div className="ps-sidebar">
        <label className="ps-search">
          <LuSearch aria-hidden="true" />
          <input type="search" placeholder="Search all wares" aria-label="Search all wares" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <CategoryNav active={active} searching={search !== ""} onSelect={selectCategory} />
      </div>

      <main className="ps-main">
        <div className="ps-main-head">
          <div>
            <div className="ps-eyebrow">{search ? "Search" : GROUP_BY_CATEGORY[active]}</div>
            <h2 className="ps-heading">{search ? `Results for “${query.trim()}”` : active}</h2>
          </div>
          <div className="ps-muted-sm">{plural(visibleItems.length, "ware")}</div>
        </div>
        {visibleItems.map((item) => {
          return <ItemCard key={item.id} item={item} qty={cartQty[item.id] || 0} showCategory={search !== ""} onSetQty={setQty} />
        })}
        {visibleItems.length === 0 && <div className="ps-no-results">No wares match “{query.trim()}”.</div>}
      </main>

      <CartPanel
        lines={cartLines}
        count={cartCount}
        money={money}
        total={cartTotal}
        onSetQty={setQty}
        onReview={openCheckout}
        onClear={() => setState((s) => ({ ...s, cart: [] }))}
      />
    </div>

    <MobileCartBar count={cartCount} total={cartTotal} onReview={openCheckout} />

    <CheckoutModal
      open={checkoutOpen}
      onOpenChange={setCheckoutOpen}
      vars={vars}
      lines={cartLines}
      money={money}
      receipt={receipt}
      onSetQty={setQty}
      onRemove={(itemId) => setQty(itemId, 0)}
      onConfirm={confirmPurchase}
      onViewPurchases={() => {
        setCheckoutOpen(false);
        setHistoryOpen(true);
      }}
    />
    <PurchasesModal open={historyOpen} onOpenChange={setHistoryOpen} vars={vars} purchases={purchases} />
    <ResetModal open={resetOpen} onOpenChange={setResetOpen} vars={vars} onReset={reset} />
  </div>
};

export default PendragonStore;
