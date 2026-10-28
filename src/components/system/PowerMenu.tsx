import { motion } from 'framer-motion';
import { Power, RotateCw, Lock } from 'lucide-react';
import { useOS } from '../../os/store';
import './PowerMenu.css';

export default function PowerMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const setPower = useOS((s) => s.setPower);
  if (!open) return null;
  return (
    <motion.div className="power-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose}>
      <motion.div
        className="power-menu"
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => {
            setPower('off');
            onClose();
          }}
        >
          <Power size={20} /> Power off
        </button>
        <button
          onClick={() => {
            setPower('booting');
            onClose();
          }}
        >
          <RotateCw size={20} /> Restart
        </button>
        <button
          onClick={() => {
            setPower('locked');
            onClose();
          }}
        >
          <Lock size={20} /> Lock
        </button>
      </motion.div>
    </motion.div>
  );
}
