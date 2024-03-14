// Code for the Setting component
import { useEffect, useState } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function Setting({ isOpen, onClose }: ModalProps) {
 const [model, setModel] = useState('claude-3-haiku-20240307');
 const [temperature, setTemperature] = useState(0.7);
 const [maxToken, setMaxToken] = useState(2048);

 useEffect(() => {
    const model =localStorage.getItem('model');
    const temperature = Number(localStorage.getItem('temperature'));
    const maxToken = Number(localStorage.getItem('maxToken'));
    if (!model) {localStorage.setItem('model', 'claude-3-haiku-20240307');}
    if (!temperature) localStorage.setItem('temperature', '0.7');
    if (!maxToken) localStorage.setItem('maxToken', '2048');

    if (model) setModel(model);
    if (temperature) setTemperature(temperature);
    if (maxToken) setMaxToken(maxToken);
 }, []);


 const handleTemperatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTemperature(Number(e.target.value));
    }
 const handleMaxTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMaxToken(Number(e.target.value));
    }
 const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setModel(e.target.value);
    }
  const saveSettings = () => {
    if (!model || !temperature || !maxToken) { alert('Please fill all the fields'); onClose(); return }
    if (model !== 'claude-3-sonnet-20240229' && model !== 'claude-3-opus-20240229' && model!= 'claude-3-haiku-20240307') { alert('Model should be either Claude 3 Sonnet, Claude 3 Opus or Claude 3 Haiku'); return }
    if (temperature < 0.1 || temperature > 1.0)  { alert('Temperature should be between 0.1 and 1.0');  return }
    if (maxToken < 1 || maxToken > 4096) { alert('Max Token should be between 1 and 4096');    return }
    localStorage.setItem('model', model);
    localStorage.setItem('temperature', temperature.toString());
    localStorage.setItem('maxToken', maxToken.toString());
    onClose();
  }


if (!isOpen) return null;
  return (
    <div id="modal" className="fixed z-10 inset-0 overflow-y-auto ">
      <div className="flex items-center justify-center min-h-screen">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3
                  className="text-lg leading-6 font-medium text-gray-900"
                  id="modal-headline"
                >
                 Properties Setting
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                  <label htmlFor="model" className="block mb-2 text-sm font-medium text-gray-900">Select an Model</label>
                  <select aria-label="model" id="model" value={model} onChange={handleModelChange}   name="model" className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                    <option value="claude-3-sonnet-20240229">Claude 3 Sonnet</option>
                    <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                    <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
                    </select>
                  </p>
                  <label  className="block mb-2 text-sm font-medium text-gray-900">Temperature</label>
                  <input  value={temperature}  onChange={handleTemperatureChange} type="number" min="0.1" max="1.0" step="0.1" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"></input>
                  <label  className="block mb-2 text-sm font-medium text-gray-900">Max Token</label>
                  <input  value={maxToken}  onChange={handleMaxTokenChange} type="number" min="1" max="4096" step="1" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"></input>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={saveSettings}
                >
                    Save
            </button>
            <button
              onClick={onClose}
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Setting;
