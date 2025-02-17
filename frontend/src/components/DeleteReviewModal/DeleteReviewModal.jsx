import { useDispatch} from "react-redux";
import {deleteReviewById} from "../../store/review"
import { useModal } from "../../context/Modal";

function DeleteReviewModal ({reviewId}) {
    const dispatch = useDispatch();
    const {closeModal} = useModal();

    const confirmedDelete = (e) => {
        e.preventDefault();
        dispatch(deleteReviewById(reviewId))
        .then(closeModal)
    }
    return (

        <div className="delete-review-prompt">
            <h1>Confirm Delete</h1>
            <p>Are you sure you want to remove this review?</p>
            <button onClick={confirmedDelete}>Yes (Delete Review)</button>
            <button onClick={closeModal}>No (Keep Review)</button>
        </div>

    )
}

export default DeleteReviewModal;
