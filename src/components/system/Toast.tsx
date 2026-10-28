import { AnimatePresence, motion } from 'framer-motion';
import { useOS } from '../../os/store';

export default function Toast() {
  const toast = useOS((s) => s.toast);
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          className="os-toast"
          initial={{ y: -18, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -12, opacity: 0 }}
          transition={{ duration: 0.22 }}
          role="status"
        >
          {toast}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
