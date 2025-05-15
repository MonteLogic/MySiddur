export interface ImageModalProps {
    imgKey: number;
    imgStringArray: string[];
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isOpen: boolean;
    closeModal: () => void;



}

