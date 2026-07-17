export default function CarrierList({ carriers, status, error }) {
  return (
    <section className="results-card" aria-labelledby="carrier-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">SIMULATED CAPACITY</p>
          <h2 id="carrier-heading">Available carriers</h2>
        </div>
        {carriers.length > 0 && <span className="result-count">{carriers.length} matches</span>}
      </div>

      {status === 'loading' && <p className="status-message">Loading carrier capacity…</p>}
      {status === 'error' && <p className="error-message" role="alert">{error}</p>}
      {status === 'idle' && (
        <p className="status-message">Run a search to see static carrier availability.</p>
      )}

      {status === 'success' && carriers.length > 0 && (
        <ul className="carrier-list">
          {carriers.map((carrier, index) => (
            <li className="carrier-row" key={carrier.name}>
              <span className="carrier-rank">{String(index + 1).padStart(2, '0')}</span>
              <span className="carrier-name">{carrier.name}</span>
              <span className="truck-count">
                <strong>{carrier.trucks_per_day}</strong>
                <small>trucks / day</small>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

