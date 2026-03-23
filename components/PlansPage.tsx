
import { Link } from 'react-router-dom';
import Services from './Services';
import Button from './Button';

const PlansPage: React.FC = () => {
  return (
    <div className="pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-6 mb-16 text-center">
        <h1 className="text-4xl md:text-6xl font-black mb-6 gradient-text">LinkedIn Premium Plans</h1>
        <p className="text-neutral-400 text-lg max-w-2xl mx-auto">
          Scale your networking, land your dream role, or dominate your sales quota with elite tools designed for modern professionals.
        </p>
      </div>

      <Services />

      <div className="max-w-4xl mx-auto px-6 mt-20">
        <div className="glass p-10 rounded-[32px] border-white/10 text-center">
          <h2 className="text-2xl font-bold text-white mb-6">Not sure which plan is right for you?</h2>
          <p className="text-neutral-500 mb-10">Our specialists are available 24/7 to help you choose the tier that matches your career objectives.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button variant="primary" as={Link} to="/how-it-works">How LinkedIn activation works</Button>
            <Button variant="outline" as={Link} to="/activation-warranty">Activation Warranty</Button>
            <Button variant="ghost" as={Link} to="/contact-support">Contact Support</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlansPage;
