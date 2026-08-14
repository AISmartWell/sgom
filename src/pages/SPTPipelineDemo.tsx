/**
 * Standalone SPT Pipeline demo (static HTML, embedded full-screen).
 * Source file: public/spt-pipeline-demo.html
 * Can also be embedded on external sites via <iframe src="/spt-pipeline-demo.html">.
 */
const SPTPipelineDemo = () => {
  return (
    <div className="min-h-screen w-full bg-background">
      <iframe
        src="/spt-pipeline-demo.html"
        title="SPT Pipeline — from Well Logs to Economics"
        className="w-full h-screen border-0"
      />
    </div>
  );
};

export default SPTPipelineDemo;
