import React, { useEffect, useState } from 'react';
import firebase from './firebase/firebase.js';
import './FlaggedUsers.css'

const usersRef = firebase.firestore().collection("USERS")

function FlaggedUsers() {
  const [flaggedUsers, setFlaggedUsers] = useState([]);
  const [sortBy, setSortBy] = useState('oldestFlag'); // Default sorting by oldest flag
  const [usernames, setUsernames] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null)
  ///       all for modal
  const openModal = () => {
    setIsModalOpen(true);
  }
  const closeModal = () => {
    setIsModalOpen(false);
  }
  const chooseFlagOption = (user) => {
    setSelectedUser(user)
    openModal()
  }
  const handleOverlayClick = (event) => {
    if (event.target.classList.contains('modal-overlay')) {
      closeModal();
    }
  }
  const handleConfirm = async (isLegitFlag) => {
    if (isLegitFlag) {
      // Code for "yay" option using selectedUser
      suspendFlaggedUser(selectedUser)
      console.log('Yay', selectedUser)
    } else {
      // Code for "nay" option
      console.log('Nay')
      await falseFlagRemoval(selectedUser.UIDdefender);
      closeModal();

    }
    closeModal()
  }


  //    FUNCTIONS FOR FLAG OPTIONS 
const suspendUserInCollection = async (collectionRef, queryField, queryValue, updateData) => {
  const snapshot = await collectionRef.where(queryField, "==", queryValue).get();

  if (!snapshot.empty) {
    const docRef = snapshot.docs[0].ref;
    await docRef.update(updateData);
    console.log('User suspended successfully');
    return true;
  }

  console.warn(`User not found in the ${collectionRef.id} collection`);
  return false;
};

const removeUserFromCollection = async (collectionRef, queryField, queryValue, additionalAction = null) => {
  const snapshot = await collectionRef.where(queryField, "==", queryValue).get();

  if (!snapshot.empty) {
    if (additionalAction) {
      await additionalAction(snapshot);
    }

    const deletePromises = snapshot.docs.map((doc) => collectionRef.doc(doc.id).delete());
    await Promise.all(deletePromises);
    console.log(`All instances of the user removed from ${collectionRef.id}`);
    return true;
  }

  console.log(`No instances of the user found in ${collectionRef.id}`);
  return false;
};

const suspendFlaggedUser = async (selectedUser) => {
  try {
    if (!selectedUser || !selectedUser.UIDdefender) {
      console.warn('Invalid selected user data');
      return;
    }

    const usersRef = firebase.firestore().collection("USERS");
    const flaggedUsersRef = firebase.firestore().collection("NATHANSFLAGGEDLIST");

    // Suspend user in USERS collection
    await suspendUserInCollection(usersRef, "Unique_ID", selectedUser.UIDdefender, {
      suspendedDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    });

    // Remove user from NATHANSFLAGGEDLIST
    const roomName = await removeUserFromCollection(flaggedUsersRef, "UIDdefender", selectedUser.UIDdefender, async (snapshot) => {
      const roomName = snapshot.docs[0].data().roomName;
      console.log('roomName:', roomName);
      if (roomName) {
        // Remove user from specified room
        await removeUserFromCollection(
          firebase.firestore().collection(roomName),
          "Unique_ID",
          selectedUser.UIDdefender,
          async () => {
            console.log('All instances of the user removed from the specified room');
          }
        );
      } else {
        console.warn('roomName is empty or undefined in selectedUser');
      }
    })
    // Delete instances from NATHANSFLAGGEDLIST
    if (roomName) {
      await removeUserFromCollection(flaggedUsersRef, "UIDdefender", selectedUser.UIDdefender);
    }
  } catch (error) {
    console.error('Error suspending user:', error);
  }
};

const falseFlagRemoval = async (userId) => {
  try {
    const flaggedUsersRef = firebase.firestore().collection("NATHANSFLAGGEDLIST");
    const userSnapshot = await flaggedUsersRef.where("UIDdefender", "==", userId).get();
    if (!userSnapshot.empty) {
      const deletePromises = userSnapshot.docs.map((doc) => flaggedUsersRef.doc(doc.id).delete());
      await Promise.all(deletePromises);
      console.log('User removed from NATHANSFLAGGEDLIST');
    } else {
      console.log('User not found in NATHANSFLAGGEDLIST');
    }
  } catch (error) {
    console.error('Error removing user from NATHANSFLAGGEDLIST:', error);
  }
};










  // POPULATING LIST    POPULATING LIST    POPULATING LIST    
  const getUsername = (uniqueID) => {
    return usernames[uniqueID] || "Unknown"; // Return "Unknown" if no match is found
  }
  const sortFlaggedUsers = () => {
    const sortedFlaggedUsers = [...flaggedUsers];
    switch (sortBy) {
      case 'UIDaccuser':
        sortedFlaggedUsers.sort((a, b) => getUsername(a.UIDaccuser).localeCompare(getUsername(b.UIDaccuser)));
        break;
      case 'UIDdefender':
        sortedFlaggedUsers.sort((a, b) => getUsername(a.UIDdefender).localeCompare(getUsername(b.UIDdefender)));
        break;
      case 'message':
        sortedFlaggedUsers.sort((a, b) => a.message.localeCompare(b.message));
        break;
      case 'time':
        sortedFlaggedUsers.sort((a, b) => a.time - b.time);
        break;
      default:
        // Default sorting by oldest flag
        sortedFlaggedUsers.sort((a, b) => a.time - b.time);
        break;
    }
    return sortedFlaggedUsers;
  }





/*
  const fetchFlaggedUsers = async () => {
    const flaggedUsersRef = firebase.firestore().collection('NATHANSFLAGGEDLIST');
    const snapshot = await flaggedUsersRef.get();
    const flaggedData = snapshot.docs.map((doc) => ({
      id: doc.id,
      roomName: doc.data().roomName, // Include roomName here
      ...doc.data(),
    }));
    setFlaggedUsers(flaggedData.map(({ roomName, ...rest }) => rest));
  };
*/ 
  const fetchFlaggedUsers = async () => {
    const flaggedUsersRef = firebase.firestore().collection('NATHANSFLAGGEDLIST');
    const snapshot = await flaggedUsersRef.get();
    const flaggedData = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setFlaggedUsers(flaggedData.map(({ roomName, ...rest }) => rest));
  }
  const fetchUsernames = async () => {
    const usersRef = firebase.firestore().collection('USERS');
    const snapshot = await usersRef.get();
    const usernameData = snapshot.docs.reduce((result, doc) => {
      const userData = doc.data();
      result[userData.Unique_ID] = userData.Username;
      return result;
    }, {});
    setUsernames(usernameData);
  }
  useEffect(() => {
    fetchFlaggedUsers()
    fetchUsernames()    
    const flaggedUsersRef = firebase.firestore().collection('NATHANSFLAGGEDLIST');
    const unsubscribeFlaggedUsers = flaggedUsersRef.onSnapshot((snapshot) => {
      const flaggedData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setFlaggedUsers(flaggedData.map(({ roomName, ...rest }) => rest));
    })
    return () => {
      unsubscribeFlaggedUsers();
    }
  }, [])
  
  const sortedFlaggedUsers = sortFlaggedUsers();

  return (
    <div className="flagged-users">
      <h1>Flagged Users</h1>
      <select className="dropdown" onChange={(e) => setSortBy(e.target.value)}>
        <option value="oldestFlag">Sort by Oldest Flag</option>
        <option value="UIDaccuser">Sort by UIDaccuser</option>
        <option value="UIDdefender">Sort by UIDdefender</option>
        <option value="message">Sort by Message</option>
        <option value="time">Sort by Time</option>
      </select>
      <ul>
        <li className="header">
          <span className="cell-15">UIDaccuser</span>
          <span className="cell-15">UIDdefender</span>
          <span className="cell-45">Message</span>
          <span className="cell-10">Time</span>
        </li>
        {sortedFlaggedUsers.map((user) => (
          <div className="flagEntry" onClick={() => chooseFlagOption(user)}>
            <li key={user.id}>
              <span className="cell-15">{getUsername(user.UIDaccuser)}</span>
              <span className="cell-15">{getUsername(user.UIDdefender)}</span>
              <span className="cell-45">{user.message}</span>
              <span className="cell-10">{user.time.toDate().toLocaleString()}</span>
              {/* <button className="action-button" onClick={() => chooseFlagOption(user)}>
                Empty Button
              </button> */}
            </li>
          </div>
        ))}
      </ul>
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleOverlayClick}>
          <div className="modal">
            <p>Do you want to flag this user?</p>
            <button style={{color: 'lightgreen'}} onClick={() => handleConfirm(true)}>Yay</button>
            <button style={{color: 'lightcoral'}} onClick={() => handleConfirm(false)}>Nay</button>
          </div>
        </div>
      )}
    </div>



  );
}

export default FlaggedUsers;
