import React from 'react';
import { Modal as ModalJsx } from './Modal.jsx';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string | React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
  showClose?: boolean;
  description?: string | null;
  className?: string;
}

export const Modal: React.FC<ModalProps> = (props) => {
  return <ModalJsx {...props} />;
};

export default Modal;
