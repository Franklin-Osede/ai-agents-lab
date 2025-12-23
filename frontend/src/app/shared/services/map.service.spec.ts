import { TestBed } from "@angular/core/testing";
import {
  HttpClientTestingModule,
  HttpTestingController,
} from "@angular/common/http/testing";
import { MapService } from "./map.service";

describe("MapService", () => {
  let service: MapService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MapService],
    });
    service = TestBed.inject(MapService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("searchAddress", () => {
    it("should return coordinates for a given address query", () => {
      const dummyResults = [
        { lat: "40.4167", lon: "-3.7037", display_name: "Sol, Madrid" },
      ];

      service.searchAddress("Sol").subscribe((results) => {
        expect(results.length).toBe(1);
        expect(results[0].display_name).toBe("Sol, Madrid");
      });

      const req = httpMock.expectOne((req) =>
        req.url.includes("nominatim.openstreetmap.org")
      );
      expect(req.request.method).toBe("GET");
      req.flush(dummyResults);
    });
  });

  describe("getRoute", () => {
    it("should return formatted route data from OSRM", () => {
      const start: [number, number] = [40.0, -3.0];
      const end: [number, number] = [40.1, -3.1];

      const mockOsrmResponse = {
        routes: [
          {
            distance: 1000,
            duration: 600,
            geometry: {
              coordinates: [
                [-3.0, 40.0],
                [-3.1, 40.1],
              ], // OSRM returns [lon, lat]
            },
          },
        ],
      };

      service.getRoute(start, end).subscribe((route) => {
        expect(route).toBeTruthy();
        expect(route.distance).toBe(1000);
        // Ensure it flipped back to [lat, lon]
        expect(route.coordinates[0]).toEqual([40.0, -3.0]);
      });

      const req = httpMock.expectOne((req) =>
        req.url.includes("router.project-osrm.org")
      );
      expect(req.request.method).toBe("GET");
      req.flush(mockOsrmResponse);
    });
  });

  describe("interpolatePosition", () => {
    it("should return start position if time is 0", () => {
      const path: [number, number][] = [
        [0, 0],
        [10, 10],
      ];
      const pos = service.interpolatePosition(path, 100, 0);
      expect(pos).toEqual([0, 0]);
    });

    it("should return end position if time exceeded duration", () => {
      const path: [number, number][] = [
        [0, 0],
        [10, 10],
      ];
      const pos = service.interpolatePosition(path, 100, 150);
      expect(pos).toEqual([10, 10]);
    });

    it("should interpolate linearly between points", () => {
      // Path from 0,0 to 10,0. Total time 10s.
      // At 5s (50%), should be at 5,0
      const path: [number, number][] = [
        [0, 0],
        [10, 0],
      ];
      const pos = service.interpolatePosition(path, 10, 5);
      expect(pos[0]).toBeCloseTo(5);
      expect(pos[1]).toBeCloseTo(0);
    });
  });
});
