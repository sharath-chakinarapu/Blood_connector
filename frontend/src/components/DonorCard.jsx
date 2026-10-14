import { fromApiBloodGroup } from "../api/domain";

export default function DonorCard({ donor }) {
  return (
    <article className="donor-card">
      <div className="donor-card__head">
        <div>
          <h3>{donor.name}</h3>
          <span className="donor-card__meta">{Number(donor.distanceKm).toFixed(1)} km away</span>
        </div>
        <span className="blood-tag">{fromApiBloodGroup(donor.bloodGroup)}</span>
      </div>
      <span className="status-pill status-pill--good">Eligible match</span>
      <div className="panel-actions">
        <a className="button button--secondary" href={`tel:${donor.phone}`}>Call donor</a>
      </div>
    </article>
  );
}
