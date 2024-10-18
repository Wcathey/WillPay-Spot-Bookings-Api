import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux"
import { getAllSpots } from "../../store/spot";
import { NavLink } from "react-router-dom";
import { FaStar } from "react-icons/fa";
import './LandingPage.css';

function LandingPage() {
    const dispatch = useDispatch();
    const allSpots = useSelector(state => state.spot.Spots);
    console.log(allSpots)
    useEffect(() => {
        dispatch(getAllSpots())
    }, [dispatch]);

    const SpotTileList = () => {
        if(allSpots) {
            return (
                allSpots.map((spot) => (
                <>
                <li key={spot.id}>
                <NavLink to={`/spots/${spot.id}`}>
                <img src={spot.previewImage}></img>
                <div className="lp-lower-details">


                <div className="lp-area-price">
                <p>{spot.city}, {spot.state}</p>
                <p>${spot.price} night</p>
                </div>
                <div className="lp-rating">
                <p><FaStar/> {spot.rating ? spot.rating : "New"}</p>
                </div>
                </div>
                </NavLink>
                </li>
                </>
                ))

            )
        }
        else {
            return (
                <>
                <p>Loading</p>
                </>
            )
        }
    }

    return (
        <div className="landing-page-container">
            <SpotTileList/>
        </div>
    )

}

export default LandingPage;
