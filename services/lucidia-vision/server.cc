#include <grpcpp/grpcpp.h>
#include "proto/vision_service.grpc.pb.h"

using lucidia::vision::v1::VisionService;
using lucidia::vision::v1::*;  // import request/response messages

class VisionServiceImpl final : public VisionService::Service {
 public:
  grpc::Status ReprojectImage(grpc::ServerContext*,
                              const ReprojectImageRequest* req,
                              ReprojectImageResponse* res) override {
    // TODO: invoke VW reprojection, enforce quotas.
    (void)req; (void)res;
    return grpc::Status::OK;
  }

  grpc::Status TilePyramid(grpc::ServerContext*,
                           const TilePyramidRequest* req,
                           TilePyramidResponse* res) override {
    // TODO: VW quadtree tiling.
    (void)req; (void)res;
    return grpc::Status::OK;
  }

  grpc::Status Mosaic(grpc::ServerContext*,
                      const MosaicRequest* req,
                      MosaicResponse* res) override {
    // TODO: VW mosaic.
    (void)req; (void)res;
    return grpc::Status::OK;
  }

  grpc::Status Hillshade(grpc::ServerContext*,
                         const HillshadeRequest* req,
                         HillshadeResponse* res) override {
    // TODO: VW hillshade.
    (void)req; (void)res;
    return grpc::Status::OK;
  }

  grpc::Status OrthorectifyDEM(grpc::ServerContext*,
                               const OrthorectifyDEMRequest* req,
                               OrthorectifyDEMResponse* res) override {
    // TODO: VW orthorectification.
    (void)req; (void)res;
    return grpc::Status::OK;
  }

  grpc::Status Resample(grpc::ServerContext*,
                        const ResampleRequest* req,
                        ResampleResponse* res) override {
    // TODO: VW resample.
    (void)req; (void)res;
    return grpc::Status::OK;
  }

  grpc::Status ColorMap(grpc::ServerContext*,
                        const ColorMapRequest* req,
                        ColorMapResponse* res) override {
    // TODO: VW color mapping.
    (void)req; (void)res;
    return grpc::Status::OK;
  }
};

int main(int argc, char** argv) {
  (void)argc; (void)argv;
  std::string server_address("0.0.0.0:50051");
  VisionServiceImpl service;

  grpc::ServerBuilder builder;
  builder.AddListeningPort(server_address, grpc::InsecureServerCredentials());
  builder.RegisterService(&service);

  std::unique_ptr<grpc::Server> server(builder.BuildAndStart());
  std::cout << "VisionService listening on " << server_address << std::endl;
  server->Wait();
  return 0;
}
