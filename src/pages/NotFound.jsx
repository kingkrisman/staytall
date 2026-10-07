import { TLink } from '../context/TransitionContext';
import Starfield from '../components/Starfield';
import { Mark } from '../components/Brand';

export default function NotFound() {
  return (
    <div className="lost">
      <Starfield className="lost__stars" density={0.6} />
      <div className="lost__inner">
        <Mark className="lost__mark" />
        <h1>404</h1>
        <p>This page drifted out of orbit.</p>
        <TLink to="/" className="btn magnetic">
          <span className="btn__fill" />
          <span className="btn__txt" data-text="Back to the store">Back to the store</span>
        </TLink>
      </div>
    </div>
  );
}
