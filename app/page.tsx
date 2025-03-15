import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="space-y-12">
      <section className="text-center py-12">
        <h1 className="text-4xl font-bold mb-4">AI-Powered Sports Analysis</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Upload your sports videos and get professional-level analysis using advanced AI technology.
          Track player movements, detect events, and gain valuable insights.
        </p>
      </section>

      <section className="grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="h-48 bg-gradient-to-r from-green-400 to-blue-500 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white text-2xl font-bold">Football Analysis</span>
            </div>
          </div>
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-2">Football Video Analysis</h2>
            <p className="text-gray-600 mb-4">
              Analyze football matches to detect passes, shots, tackles, and player movements.
              Get detailed event tracking and tactical insights.
            </p>
            <ul className="list-disc list-inside mb-6 text-gray-700">
              <li>Player tracking and movement analysis</li>
              <li>Pass detection and success rate</li>
              <li>Shot analysis and expected goals</li>
              <li>Tactical formation insights</li>
            </ul>
            <Link 
              href="/football" 
              className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-200"
            >
              Analyze Football Video
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="h-48 bg-gradient-to-r from-yellow-400 to-orange-500 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white text-2xl font-bold">Tennis Analysis</span>
            </div>
          </div>
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-2">Tennis Video Analysis</h2>
            <p className="text-gray-600 mb-4">
              Track tennis players and ball movements to analyze player performance,
              speed, distance covered, and tactical patterns.
            </p>
            <ul className="list-disc list-inside mb-6 text-gray-700">
              <li>Player movement and court coverage</li>
              <li>Speed and distance metrics</li>
              <li>Shot placement analysis</li>
              <li>Tactical pattern recognition</li>
            </ul>
            <Link 
              href="/tennis" 
              className="block w-full text-center bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded transition duration-200"
            >
              Analyze Tennis Video
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-gray-100 p-8 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-blue-500 text-4xl font-bold mb-2">1</div>
            <h3 className="text-xl font-semibold mb-2">Upload Your Video</h3>
            <p className="text-gray-600">
              Upload your football or tennis video in common formats like MP4, MOV, or AVI.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-blue-500 text-4xl font-bold mb-2">2</div>
            <h3 className="text-xl font-semibold mb-2">AI Processing</h3>
            <p className="text-gray-600">
              Our AI models detect players and ball, track movements, and analyze patterns.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-blue-500 text-4xl font-bold mb-2">3</div>
            <h3 className="text-xl font-semibold mb-2">Get Detailed Analysis</h3>
            <p className="text-gray-600">
              Receive comprehensive analysis with visualizations and actionable insights.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
