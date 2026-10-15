package com.FreshRoute.service;

import com.FreshRoute.model.Batch;
import com.FreshRoute.model.Destination;
import com.FreshRoute.repository.AllocationRepository;
import com.FreshRoute.repository.BatchRepository;
import com.FreshRoute.repository.DestinationRepository;
import com.FreshRoute.repository.PlanResultRepository;
import jakarta.annotation.PostConstruct;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Service
@Slf4j
public class DataInitializerService {

    private final BatchRepository batchRepository;
    private final DestinationRepository destinationRepository;
    private final PlanResultRepository planResultRepository;
    private final AllocationRepository allocationRepository;
    private final TransactionTemplate transactionTemplate;

    @PersistenceContext
    private EntityManager entityManager;

    public DataInitializerService(
            BatchRepository batchRepository,
            DestinationRepository destinationRepository,
            PlanResultRepository planResultRepository,
            AllocationRepository allocationRepository,
            TransactionTemplate transactionTemplate) {
        this.batchRepository = batchRepository;
        this.destinationRepository = destinationRepository;
        this.planResultRepository = planResultRepository;
        this.allocationRepository = allocationRepository;
        this.transactionTemplate = transactionTemplate;
    }

    @PostConstruct
    public void init() {
        transactionTemplate.executeWithoutResult(status -> {
            if (batchRepository.count() == 0 || destinationRepository.count() == 0) {
                seedData();
            }
        });
    }

    @Transactional
    public void seedData() {
        log.info("Seeding Indian Agro-Climatic Dataset (MoFPI 2020-22 Reference)...");

        // Clear existing records cleanly at database level and flush/clear Hibernate session
        if (entityManager != null) {
            entityManager.createNativeQuery("DELETE FROM allocations").executeUpdate();
            entityManager.createNativeQuery("DELETE FROM plan_results").executeUpdate();
            entityManager.createNativeQuery("DELETE FROM batches").executeUpdate();
            entityManager.createNativeQuery("DELETE FROM destinations").executeUpdate();
            entityManager.flush();
            entityManager.clear();
        } else {
            allocationRepository.deleteAllInBatch();
            planResultRepository.deleteAllInBatch();
            batchRepository.deleteAllInBatch();
            destinationRepository.deleteAllInBatch();
        }

        // 1. Destinations (Major Indian Wholesale Mandis)
        List<Destination> destinations = Arrays.asList(
                Destination.builder()
                        .destinationCode("DEST-MUMBAI")
                        .name("Vashi APMC, Navi Mumbai")
                        .region("West Coastal Zone")
                        .state("Maharashtra")
                        .demandKg(1800.0)
                        .offeredPricePerKg(25.0)
                        .transportTimeHours(4.0)
                        .transportCostPerKg(2.5)
                        .handlingTimeHours(2.0)
                        .handlingCostPerKg(1.2)
                        .capacityLimitKg(2500.0)
                        .active(true)
                        .delayHours(0.0)
                        .demandUrgencyWeight(1.4)
                        .build(),

                Destination.builder()
                        .destinationCode("DEST-PUNE")
                        .name("Pune Gultekdi Mandi")
                        .region("Western Maharashtra")
                        .state("Maharashtra")
                        .demandKg(1400.0)
                        .offeredPricePerKg(23.0)
                        .transportTimeHours(3.5)
                        .transportCostPerKg(2.0)
                        .handlingTimeHours(1.5)
                        .handlingCostPerKg(1.0)
                        .capacityLimitKg(2000.0)
                        .active(true)
                        .delayHours(0.0)
                        .demandUrgencyWeight(1.2)
                        .build(),

                Destination.builder()
                        .destinationCode("DEST-AHMEDABAD")
                        .name("Ahmedabad APMC Mandi")
                        .region("Gujarat Semi-Arid")
                        .state("Gujarat")
                        .demandKg(1200.0)
                        .offeredPricePerKg(28.0)
                        .transportTimeHours(9.0)
                        .transportCostPerKg(4.5)
                        .handlingTimeHours(2.5)
                        .handlingCostPerKg(1.3)
                        .capacityLimitKg(1800.0)
                        .active(true)
                        .delayHours(0.0)
                        .demandUrgencyWeight(1.1)
                        .build(),

                Destination.builder()
                        .destinationCode("DEST-BENGALURU")
                        .name("Yeshwanthpur Hub, Bengaluru")
                        .region("South Deccan Plateau")
                        .state("Karnataka")
                        .demandKg(1600.0)
                        .offeredPricePerKg(30.0)
                        .transportTimeHours(16.0)
                        .transportCostPerKg(6.5)
                        .handlingTimeHours(3.0)
                        .handlingCostPerKg(1.5)
                        .capacityLimitKg(2200.0)
                        .active(true)
                        .delayHours(0.0)
                        .demandUrgencyWeight(1.3)
                        .build(),

                Destination.builder()
                        .destinationCode("DEST-CHENNAI")
                        .name("Koyambedu Wholesale, Chennai")
                        .region("Southern Coastal Plain")
                        .state("Tamil Nadu")
                        .demandKg(1100.0)
                        .offeredPricePerKg(32.0)
                        .transportTimeHours(21.0)
                        .transportCostPerKg(8.0)
                        .handlingTimeHours(3.0)
                        .handlingCostPerKg(1.6)
                        .capacityLimitKg(1500.0)
                        .active(true)
                        .delayHours(0.0)
                        .demandUrgencyWeight(1.2)
                        .build(),

                Destination.builder()
                        .destinationCode("DEST-DELHI")
                        .name("Azadpur Mandi, Delhi")
                        .region("Northern Indo-Gangetic Plain")
                        .state("Delhi NCR")
                        .demandKg(2200.0)
                        .offeredPricePerKg(36.0)
                        .transportTimeHours(26.0)
                        .transportCostPerKg(9.5)
                        .handlingTimeHours(4.0)
                        .handlingCostPerKg(2.0)
                        .capacityLimitKg(3000.0)
                        .active(true)
                        .delayHours(0.0)
                        .demandUrgencyWeight(1.5)
                        .latitude(28.7150)
                        .longitude(77.1720)
                        .build(),

                // Punjab Regional Network Mandis (Frontend Network Match)
                Destination.builder()
                        .destinationCode("ludhiana-mandi")
                        .name("Ludhiana Mandi")
                        .region("Punjab Central Hub")
                        .state("Punjab")
                        .demandKg(2400.0)
                        .offeredPricePerKg(34.0)
                        .transportTimeHours(2.5)
                        .transportCostPerKg(3.5)
                        .handlingTimeHours(1.0)
                        .handlingCostPerKg(1.0)
                        .capacityLimitKg(2000.0)
                        .active(true)
                        .delayHours(0.0)
                        .demandUrgencyWeight(1.4)
                        .latitude(30.9010)
                        .longitude(75.8573)
                        .build(),

                Destination.builder()
                        .destinationCode("jalandhar-retail")
                        .name("Jalandhar Retail")
                        .region("Doaba Agricultural Belt")
                        .state("Punjab")
                        .demandKg(800.0)
                        .offeredPricePerKg(30.0)
                        .transportTimeHours(1.5)
                        .transportCostPerKg(2.5)
                        .handlingTimeHours(0.5)
                        .handlingCostPerKg(0.8)
                        .capacityLimitKg(900.0)
                        .active(true)
                        .delayHours(0.0)
                        .demandUrgencyWeight(1.2)
                        .latitude(31.3260)
                        .longitude(75.5762)
                        .build(),

                Destination.builder()
                        .destinationCode("amritsar-wholesale")
                        .name("Amritsar Wholesale")
                        .region("Majha Wholesale Hub")
                        .state("Punjab")
                        .demandKg(2000.0)
                        .offeredPricePerKg(31.0)
                        .transportTimeHours(3.5)
                        .transportCostPerKg(3.0)
                        .handlingTimeHours(1.0)
                        .handlingCostPerKg(1.0)
                        .capacityLimitKg(2200.0)
                        .active(true)
                        .delayHours(0.0)
                        .demandUrgencyWeight(1.3)
                        .latitude(31.6340)
                        .longitude(74.8723)
                        .build(),

                Destination.builder()
                        .destinationCode("patiala-institutional")
                        .name("Patiala Institutional Buyers")
                        .region("Malwa South Plain")
                        .state("Punjab")
                        .demandKg(900.0)
                        .offeredPricePerKg(33.0)
                        .transportTimeHours(2.5)
                        .transportCostPerKg(3.0)
                        .handlingTimeHours(1.0)
                        .handlingCostPerKg(1.0)
                        .capacityLimitKg(900.0)
                        .active(true)
                        .delayHours(0.0)
                        .demandUrgencyWeight(1.2)
                        .latitude(30.3398)
                        .longitude(76.3869)
                        .build(),

                Destination.builder()
                        .destinationCode("processing-unit")
                        .name("Processing Unit")
                        .region("Mohali Agro-Processing Zone")
                        .state("Punjab")
                        .demandKg(300.0)
                        .offeredPricePerKg(20.0)
                        .transportTimeHours(1.0)
                        .transportCostPerKg(2.0)
                        .handlingTimeHours(0.5)
                        .handlingCostPerKg(0.5)
                        .capacityLimitKg(300.0)
                        .active(true)
                        .delayHours(0.0)
                        .demandUrgencyWeight(1.0)
                        .latitude(30.7046)
                        .longitude(76.7179)
                        .build(),

                Destination.builder()
                        .destinationCode("delhi-ncr")
                        .name("Delhi NCR")
                        .region("Northern Indo-Gangetic Plain")
                        .state("Delhi NCR")
                        .demandKg(1800.0)
                        .offeredPricePerKg(38.0)
                        .transportTimeHours(9.0)
                        .transportCostPerKg(5.0)
                        .handlingTimeHours(2.0)
                        .handlingCostPerKg(1.5)
                        .capacityLimitKg(2000.0)
                        .active(true)
                        .delayHours(0.0)
                        .demandUrgencyWeight(1.5)
                        .latitude(28.6139)
                        .longitude(77.2090)
                        .build(),

                Destination.builder()
                        .destinationCode("kolkata-cold-chain")
                        .name("Kolkata Cold Chain")
                        .region("Eastern Logistics Corridor")
                        .state("West Bengal")
                        .demandKg(1500.0)
                        .offeredPricePerKg(36.0)
                        .transportTimeHours(30.0)
                        .transportCostPerKg(7.5)
                        .handlingTimeHours(4.0)
                        .handlingCostPerKg(2.0)
                        .capacityLimitKg(1500.0)
                        .active(true)
                        .delayHours(0.0)
                        .demandUrgencyWeight(1.3)
                        .latitude(22.5726)
                        .longitude(88.3639)
                        .build()
        );
        destinationRepository.saveAll(destinations);

        // 2. Inventory Batches (Covering critical low shelf-life, medium, and long shelf-life)
        LocalDateTime now = LocalDateTime.now();
        List<Batch> batches = Arrays.asList(
                // Ultra-urgent Tomato batch from Nashik (only 16h shelf life!)
                Batch.builder()
                        .batchCode("B-TOM-101")
                        .commodity("Tomato")
                        .originLocation("Nashik Hub, Maharashtra")
                        .quantityKg(600.0)
                        .remainingShelfLifeHours(16.0)
                        .shelfLifeMinHours(13.0)
                        .shelfLifeMaxHours(18.0)
                        .baseCostPerKg(14.0)
                        .referenceMarketPricePerKg(24.0)
                        .storageCondition("Ambient 26°C")
                        .storageTempC(26.0)
                        .perishabilityFactor(0.85)
                        .harvestTimestamp(now.minusHours(32))
                        .notes("High climacteric ripening stage. Must reach nearby mandi within 12h.")
                        .build(),

                // Medium-urgency Tomato batch
                Batch.builder()
                        .batchCode("B-TOM-102")
                        .commodity("Tomato")
                        .originLocation("Nashik Hub, Maharashtra")
                        .quantityKg(800.0)
                        .remainingShelfLifeHours(28.0)
                        .shelfLifeMinHours(24.0)
                        .shelfLifeMaxHours(32.0)
                        .baseCostPerKg(15.0)
                        .referenceMarketPricePerKg(25.0)
                        .storageCondition("Ambient 24°C")
                        .storageTempC(24.0)
                        .perishabilityFactor(0.80)
                        .harvestTimestamp(now.minusHours(20))
                        .notes("Firm breaker stage. Suitable for mid-distance transport.")
                        .build(),

                // Fresh Tomato batch (adequate shelf life for long haul)
                Batch.builder()
                        .batchCode("B-TOM-103")
                        .commodity("Tomato")
                        .originLocation("Pimpalgaon APMC, Nashik")
                        .quantityKg(1200.0)
                        .remainingShelfLifeHours(54.0)
                        .shelfLifeMinHours(48.0)
                        .shelfLifeMaxHours(60.0)
                        .baseCostPerKg(16.0)
                        .referenceMarketPricePerKg(26.0)
                        .storageCondition("Pre-cooled Reefer 12°C")
                        .storageTempC(12.0)
                        .perishabilityFactor(0.70)
                        .harvestTimestamp(now.minusHours(6))
                        .notes("Green mature grade. Perfect candidate for Delhi/Chennai transit.")
                        .build(),

                // Critical Low Shelf-life Spinach (Leafy green - 14h shelf life!)
                Batch.builder()
                        .batchCode("B-SPN-201")
                        .commodity("Spinach (Palak)")
                        .originLocation("Junnar Farm Belt, Pune")
                        .quantityKg(450.0)
                        .remainingShelfLifeHours(14.0)
                        .shelfLifeMinHours(11.0)
                        .shelfLifeMaxHours(16.0)
                        .baseCostPerKg(12.0)
                        .referenceMarketPricePerKg(22.0)
                        .storageCondition("Ambient 27°C")
                        .storageTempC(27.0)
                        .perishabilityFactor(0.95)
                        .harvestTimestamp(now.minusHours(14))
                        .notes("High respiration leafy vegetable. Will wilt completely if transit > 8h.")
                        .build(),

                // Fresh Spinach batch
                Batch.builder()
                        .batchCode("B-SPN-202")
                        .commodity("Spinach (Palak)")
                        .originLocation("Khed Farm, Pune")
                        .quantityKg(550.0)
                        .remainingShelfLifeHours(22.0)
                        .shelfLifeMinHours(18.0)
                        .shelfLifeMaxHours(25.0)
                        .baseCostPerKg(13.0)
                        .referenceMarketPricePerKg(24.0)
                        .storageCondition("Hydro-cooled 8°C")
                        .storageTempC(8.0)
                        .perishabilityFactor(0.90)
                        .harvestTimestamp(now.minusHours(5))
                        .notes("Hydro-cooled leafy bundle with extended freshness.")
                        .build(),

                // Ripe Banana batch (Critical 20h shelf life)
                Batch.builder()
                        .batchCode("B-BAN-301")
                        .commodity("Banana (Grand Naine)")
                        .originLocation("Jalgaon Hub, Maharashtra")
                        .quantityKg(900.0)
                        .remainingShelfLifeHours(20.0)
                        .shelfLifeMinHours(16.0)
                        .shelfLifeMaxHours(24.0)
                        .baseCostPerKg(18.0)
                        .referenceMarketPricePerKg(30.0)
                        .storageCondition("Ambient 28°C")
                        .storageTempC(28.0)
                        .perishabilityFactor(0.85)
                        .harvestTimestamp(now.minusHours(40))
                        .notes("Stage 5 ripening (yellow with green tips). Imminent sugar spotting.")
                        .build(),

                // Green Banana batch (Sturdy 72h shelf life)
                Batch.builder()
                        .batchCode("B-BAN-302")
                        .commodity("Banana (Grand Naine)")
                        .originLocation("Jalgaon Hub, Maharashtra")
                        .quantityKg(1500.0)
                        .remainingShelfLifeHours(72.0)
                        .shelfLifeMinHours(64.0)
                        .shelfLifeMaxHours(80.0)
                        .baseCostPerKg(19.0)
                        .referenceMarketPricePerKg(32.0)
                        .storageCondition("Cold Storage 14°C")
                        .storageTempC(14.0)
                        .perishabilityFactor(0.60)
                        .harvestTimestamp(now.minusHours(10))
                        .notes("Stage 2 green harvest. Ample transit endurance for North India.")
                        .build(),

                // Premium Alphonso Mango batch (36h shelf life)
                Batch.builder()
                        .batchCode("B-MNG-401")
                        .commodity("Mango (Alphonso)")
                        .originLocation("Ratnagiri Orchard, Konkan")
                        .quantityKg(700.0)
                        .remainingShelfLifeHours(36.0)
                        .shelfLifeMinHours(30.0)
                        .shelfLifeMaxHours(42.0)
                        .baseCostPerKg(60.0)
                        .referenceMarketPricePerKg(110.0)
                        .storageCondition("Controlled Ambient 22°C")
                        .storageTempC(22.0)
                        .perishabilityFactor(0.75)
                        .harvestTimestamp(now.minusHours(24))
                        .notes("Semi-ripe GI-tagged fruit. High value per kg.")
                        .build(),

                // Fresh Alphonso Mango batch (68h shelf life)
                Batch.builder()
                        .batchCode("B-MNG-402")
                        .commodity("Mango (Alphonso)")
                        .originLocation("Devgad Orchard, Konkan")
                        .quantityKg(850.0)
                        .remainingShelfLifeHours(68.0)
                        .shelfLifeMinHours(60.0)
                        .shelfLifeMaxHours(75.0)
                        .baseCostPerKg(65.0)
                        .referenceMarketPricePerKg(120.0)
                        .storageCondition("Cold Storage 12°C")
                        .storageTempC(12.0)
                        .perishabilityFactor(0.65)
                        .harvestTimestamp(now.minusHours(8))
                        .notes("Export grade mature harvest.")
                        .build(),

                // Kolar Tomato batch (South zone)
                Batch.builder()
                        .batchCode("B-TOM-104")
                        .commodity("Tomato")
                        .originLocation("Kolar Farm Hub, Karnataka")
                        .quantityKg(1000.0)
                        .remainingShelfLifeHours(42.0)
                        .shelfLifeMinHours(36.0)
                        .shelfLifeMaxHours(48.0)
                        .baseCostPerKg(15.0)
                        .referenceMarketPricePerKg(27.0)
                        .storageCondition("Ambient 25°C")
                        .storageTempC(25.0)
                        .perishabilityFactor(0.75)
                        .harvestTimestamp(now.minusHours(18))
                        .notes("Red firm hybrid. Ideal for Bengaluru & Chennai absorption.")
                        .build(),

                // --- Punjab Produce Network Batches (Frontend Alignment) ---
                Batch.builder()
                        .batchCode("FP-1041")
                        .commodity("Tomatoes")
                        .originLocation("Central Packhouse, Ludhiana")
                        .quantityKg(1200.0)
                        .remainingShelfLifeHours(5.0)
                        .shelfLifeMinHours(3.0)
                        .shelfLifeMaxHours(8.0)
                        .baseCostPerKg(18.0)
                        .referenceMarketPricePerKg(28.0)
                        .storageCondition("Ambient 31°C")
                        .storageTempC(31.0)
                        .perishabilityFactor(0.85)
                        .harvestTimestamp(LocalDateTime.of(2026, 10, 12, 6, 30))
                        .packedAt(LocalDateTime.of(2026, 10, 12, 6, 30))
                        .warehouseId("demo-hub-central")
                        .emoji("🍅")
                        .recommendedAction("Dispatch now to Ludhiana mandi")
                        .respirationRate("High Climacteric (22–28 mg CO₂/kg·h · ethylene autocatalysis)")
                        .optimumTemp("10°C – 12°C (chilling sensitive below 8°C)")
                        .notes("High urgency climacteric stage. Tight window under ambient heat.")
                        .build(),

                Batch.builder()
                        .batchCode("FP-1042")
                        .commodity("Bananas")
                        .originLocation("Central Packhouse, Ludhiana")
                        .quantityKg(800.0)
                        .remainingShelfLifeHours(30.0)
                        .shelfLifeMinHours(26.0)
                        .shelfLifeMaxHours(36.0)
                        .baseCostPerKg(22.0)
                        .referenceMarketPricePerKg(35.0)
                        .storageCondition("Cold Storage 14°C")
                        .storageTempC(14.0)
                        .perishabilityFactor(0.70)
                        .harvestTimestamp(LocalDateTime.of(2026, 10, 11, 18, 0))
                        .packedAt(LocalDateTime.of(2026, 10, 11, 18, 0))
                        .warehouseId("demo-hub-central")
                        .emoji("🍌")
                        .recommendedAction("Hold for regular retail dispatch")
                        .respirationRate("Moderate Climacteric (16–22 mg CO₂/kg·h)")
                        .optimumTemp("13°C – 14°C (chilling sensitive below 11°C)")
                        .notes("Stage 3 ripening. Stable for regular retail distribution.")
                        .build(),

                Batch.builder()
                        .batchCode("FP-1043")
                        .commodity("Onions")
                        .originLocation("North Hub, Amritsar")
                        .quantityKg(2400.0)
                        .remainingShelfLifeHours(16.0)
                        .shelfLifeMinHours(14.0)
                        .shelfLifeMaxHours(20.0)
                        .baseCostPerKg(20.0)
                        .referenceMarketPricePerKg(32.0)
                        .storageCondition("Well-Ventilated Shed")
                        .storageTempC(25.0)
                        .perishabilityFactor(0.40)
                        .harvestTimestamp(LocalDateTime.of(2026, 10, 10, 9, 15))
                        .packedAt(LocalDateTime.of(2026, 10, 10, 9, 15))
                        .warehouseId("demo-hub-north")
                        .emoji("🧅")
                        .recommendedAction("Route to Amritsar wholesale market")
                        .respirationRate("Low Basal (5–8 mg CO₂/kg·h)")
                        .optimumTemp("15°C – 20°C (well-ventilated dry ambient)")
                        .notes("Cured rabi bulbs. Ready for wholesale auction.")
                        .build(),

                Batch.builder()
                        .batchCode("FP-1044")
                        .commodity("Spinach")
                        .originLocation("Central Packhouse, Ludhiana")
                        .quantityKg(350.0)
                        .remainingShelfLifeHours(7.0)
                        .shelfLifeMinHours(5.0)
                        .shelfLifeMaxHours(9.0)
                        .baseCostPerKg(14.0)
                        .referenceMarketPricePerKg(22.0)
                        .storageCondition("Ambient 29°C")
                        .storageTempC(29.0)
                        .perishabilityFactor(0.95)
                        .harvestTimestamp(LocalDateTime.of(2026, 10, 13, 5, 0))
                        .packedAt(LocalDateTime.of(2026, 10, 13, 5, 0))
                        .warehouseId("demo-hub-central")
                        .emoji("🥬")
                        .recommendedAction("Apply 25% discount and clear locally")
                        .respirationRate("Very High (45–60 mg CO₂/kg·h · rapid water transpiration)")
                        .optimumTemp("2°C – 4°C with >95% Relative Humidity")
                        .notes("Wilting risk severe. Requires prompt local discount clearance.")
                        .build(),

                Batch.builder()
                        .batchCode("FP-1045")
                        .commodity("Potatoes")
                        .originLocation("South Hub, Patiala")
                        .quantityKg(3000.0)
                        .remainingShelfLifeHours(60.0)
                        .shelfLifeMinHours(54.0)
                        .shelfLifeMaxHours(72.0)
                        .baseCostPerKg(15.0)
                        .referenceMarketPricePerKg(24.0)
                        .storageCondition("Cold Storage 4°C")
                        .storageTempC(4.0)
                        .perishabilityFactor(0.30)
                        .harvestTimestamp(LocalDateTime.of(2026, 10, 8, 14, 20))
                        .packedAt(LocalDateTime.of(2026, 10, 8, 14, 20))
                        .warehouseId("demo-hub-south")
                        .emoji("🥔")
                        .recommendedAction("Move to cold storage buffer")
                        .respirationRate("Very Low (4–6 mg CO₂/kg·h)")
                        .optimumTemp("8°C – 10°C (processing/table grade)")
                        .notes("Table grade tubers with high shelf durability.")
                        .build(),

                Batch.builder()
                        .batchCode("FP-1046")
                        .commodity("Cauliflower")
                        .originLocation("South Hub, Patiala")
                        .quantityKg(900.0)
                        .remainingShelfLifeHours(9.0)
                        .shelfLifeMinHours(7.0)
                        .shelfLifeMaxHours(12.0)
                        .baseCostPerKg(20.0)
                        .referenceMarketPricePerKg(30.0)
                        .storageCondition("Shaded Air Flow")
                        .storageTempC(26.0)
                        .perishabilityFactor(0.85)
                        .harvestTimestamp(LocalDateTime.of(2026, 10, 12, 11, 45))
                        .packedAt(LocalDateTime.of(2026, 10, 12, 11, 45))
                        .warehouseId("demo-hub-south")
                        .emoji("🥦")
                        .recommendedAction("Bulk sale to institutional buyers")
                        .respirationRate("High (20–25 mg CO₂/kg·h · curd yellowing)")
                        .optimumTemp("0°C – 2°C with high humidity")
                        .notes("Firm snow-white curds. Institutional bulk sale recommended.")
                        .build(),

                Batch.builder()
                        .batchCode("FP-1047")
                        .commodity("Tomatoes")
                        .originLocation("North Hub, Amritsar")
                        .quantityKg(650.0)
                        .remainingShelfLifeHours(20.0)
                        .shelfLifeMinHours(17.0)
                        .shelfLifeMaxHours(24.0)
                        .baseCostPerKg(17.0)
                        .referenceMarketPricePerKg(26.0)
                        .storageCondition("Pre-cooled 15°C")
                        .storageTempC(15.0)
                        .perishabilityFactor(0.75)
                        .harvestTimestamp(LocalDateTime.of(2026, 10, 12, 20, 10))
                        .packedAt(LocalDateTime.of(2026, 10, 12, 20, 10))
                        .warehouseId("demo-hub-north")
                        .emoji("🍅")
                        .recommendedAction("Prioritise Jalandhar retailers")
                        .respirationRate("Moderate Climacteric (18–22 mg CO₂/kg·h)")
                        .optimumTemp("10°C – 12°C")
                        .notes("Breaker stage tomatoes. Excellent for nearby retail.")
                        .build(),

                Batch.builder()
                        .batchCode("FP-1048")
                        .commodity("Methi Leaves")
                        .originLocation("Central Packhouse, Ludhiana")
                        .quantityKg(280.0)
                        .remainingShelfLifeHours(6.0)
                        .shelfLifeMinHours(4.0)
                        .shelfLifeMaxHours(8.0)
                        .baseCostPerKg(12.0)
                        .referenceMarketPricePerKg(20.0)
                        .storageCondition("Ambient 28°C")
                        .storageTempC(28.0)
                        .perishabilityFactor(0.95)
                        .harvestTimestamp(LocalDateTime.of(2026, 10, 13, 1, 40))
                        .packedAt(LocalDateTime.of(2026, 10, 13, 1, 40))
                        .warehouseId("demo-hub-central")
                        .emoji("🌿")
                        .recommendedAction("Divert to processing unit")
                        .respirationRate("Extreme (50–70 mg CO₂/kg·h · fast senescence)")
                        .optimumTemp("1°C – 3°C")
                        .notes("Fragile aromatic greens. Direct diversion to processing unit.")
                        .build(),

                Batch.builder()
                        .batchCode("FP-1049")
                        .commodity("Bananas")
                        .originLocation("South Hub, Patiala")
                        .quantityKg(1500.0)
                        .remainingShelfLifeHours(48.0)
                        .shelfLifeMinHours(42.0)
                        .shelfLifeMaxHours(54.0)
                        .baseCostPerKg(22.0)
                        .referenceMarketPricePerKg(34.0)
                        .storageCondition("Cold Storage 13°C")
                        .storageTempC(13.0)
                        .perishabilityFactor(0.65)
                        .harvestTimestamp(LocalDateTime.of(2026, 10, 9, 7, 0))
                        .packedAt(LocalDateTime.of(2026, 10, 9, 7, 0))
                        .warehouseId("demo-hub-south")
                        .emoji("🍌")
                        .recommendedAction("Schedule for Delhi NCR run")
                        .respirationRate("Green mature (12–16 mg CO₂/kg·h)")
                        .optimumTemp("13°C – 14°C")
                        .notes("Ample shelf buffer. Ideal for inter-state long haul transit.")
                        .build(),

                Batch.builder()
                        .batchCode("FP-1050")
                        .commodity("Onions")
                        .originLocation("North Hub, Amritsar")
                        .quantityKg(1800.0)
                        .remainingShelfLifeHours(40.0)
                        .shelfLifeMinHours(35.0)
                        .shelfLifeMaxHours(46.0)
                        .baseCostPerKg(20.0)
                        .referenceMarketPricePerKg(31.0)
                        .storageCondition("Ventilated Curing Shed")
                        .storageTempC(24.0)
                        .perishabilityFactor(0.40)
                        .harvestTimestamp(LocalDateTime.of(2026, 10, 7, 16, 30))
                        .packedAt(LocalDateTime.of(2026, 10, 7, 16, 30))
                        .warehouseId("demo-hub-north")
                        .emoji("🧅")
                        .recommendedAction("Hold in ventilated store")
                        .respirationRate("Low (5–7 mg CO₂/kg·h)")
                        .optimumTemp("15°C – 20°C")
                        .notes("Grade-A cured onions with low dehydration rate.")
                        .build(),

                Batch.builder()
                        .batchCode("FP-1051")
                        .commodity("Potatoes")
                        .originLocation("Central Packhouse, Ludhiana")
                        .quantityKg(2100.0)
                        .remainingShelfLifeHours(22.0)
                        .shelfLifeMinHours(18.0)
                        .shelfLifeMaxHours(26.0)
                        .baseCostPerKg(15.0)
                        .referenceMarketPricePerKg(23.0)
                        .storageCondition("Ambient 22°C")
                        .storageTempC(22.0)
                        .perishabilityFactor(0.50)
                        .harvestTimestamp(LocalDateTime.of(2026, 10, 11, 10, 0))
                        .packedAt(LocalDateTime.of(2026, 10, 11, 10, 0))
                        .warehouseId("demo-hub-central")
                        .emoji("🥔")
                        .recommendedAction("Sell to Kolkata cold chain partner")
                        .respirationRate("Moderate (8–10 mg CO₂/kg·h)")
                        .optimumTemp("8°C – 10°C")
                        .notes("Kolkata partner contract candidate. Adequate buffer.")
                        .build(),

                Batch.builder()
                        .batchCode("FP-1052")
                        .commodity("Tomatoes")
                        .originLocation("South Hub, Patiala")
                        .quantityKg(420.0)
                        .remainingShelfLifeHours(7.0)
                        .shelfLifeMinHours(5.0)
                        .shelfLifeMaxHours(9.0)
                        .baseCostPerKg(17.0)
                        .referenceMarketPricePerKg(27.0)
                        .storageCondition("Ambient 29°C")
                        .storageTempC(29.0)
                        .perishabilityFactor(0.85)
                        .harvestTimestamp(LocalDateTime.of(2026, 10, 13, 3, 15))
                        .packedAt(LocalDateTime.of(2026, 10, 13, 3, 15))
                        .warehouseId("demo-hub-south")
                        .emoji("🍅")
                        .recommendedAction("Apply 15% discount for same-day pickup")
                        .respirationRate("High Climacteric (24–28 mg CO₂/kg·h)")
                        .optimumTemp("10°C – 12°C")
                        .notes("Full red ripe. 15% discount for immediate same-day pickup.")
                        .build()
        );
        batchRepository.saveAll(batches);

        log.info("Seeding complete: {} batches and {} destinations initialized.", batches.size(), destinations.size());
    }
}
