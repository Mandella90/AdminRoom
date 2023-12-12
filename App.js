import React from 'react';
import ReactDOM from 'react-dom';
import FlaggedUsers from './FlaggedUsers';

function App() {
  return (
    <div>
      <FlaggedUsers />
    </div>
  );
}
ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

export default App;
