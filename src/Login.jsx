import React, { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "./firebase";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (isSignup) {
        await createUserWithEmailAndPassword(auth, email, password);
        navigate("/dashboard");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  console.log("Login component rendered");

  return (
    <div className="max-w-md mx-auto mt-24 p-5 border border-gray-300 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-center">
        {isSignup ? "Бүртгүүлэх" : "Нэвтрэх"}
      </h2>
      {error && <p className="text-red-500 text-center mt-2">{error}</p>}
      <form onSubmit={handleSubmit} className="mt-4">
        <div className="mb-4">
          <label className="block mb-1 text-gray-700">И-мэйл:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1 text-gray-700">Нууц үг:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          />
        </div>
        <button
          type="submit"
          className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          {isSignup ? "Бүртгүүлэх" : "Нэвтрэх"}
        </button>
      </form>
      <p className="mt-3 text-center">
        {isSignup ? "Бүртгэлтэй хэрэглэгч үү?" : "Бүртгэлгүй хэрэглэгч үү?"}{" "}
        <button
          onClick={() => setIsSignup(!isSignup)}
          className="text-blue-500 hover:underline bg-transparent border-none cursor-pointer"
        >
          {isSignup ? "Нэвтрэх" : "Бүртгүүлэх"}
        </button>
      </p>
    </div>
  );
};

export default Login;
